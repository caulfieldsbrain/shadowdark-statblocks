import {
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  normalizePath,
  parseYaml
} from "obsidian";
import {
  getAllMonsterIndexEntries,
  getSuggestedOtherSources,
  getSuggestedTags
} from "./services/monsterIndexService";
import { DEFAULT_SETTINGS, ShadowdarkStatblocksSettings } from "./settings";
import { parseCodeBlock } from "./parsing/parseCodeBlock";
import { parseFrontmatter } from "./parsing/parseFrontmatter";
import { parseRawShadowdarkText } from "./parsing/parseRawShadowdarkText";
import { renderMonsterBlock } from "./render/renderMonsterBlock";
import { buildMonsterTemplate } from "./templates/monsterTemplate";
import { buildMonsterFrontmatter, buildMonsterNoteContent } from "./utils/monsterNoteContent";
import { ShadowdarkStatblocksSettingTab } from "./settingsTab";
import { ImportPreviewModal } from "./modals/ImportPreviewModal";
import { DuplicateMonsterModal } from "./modals/DuplicateMonsterModal";
import { ShadowdarkMonster } from "./types";
import { splitRawShadowdarkBlocks } from "./utils/splitRawShadowdarkBlocks";
import { MonsterBrowserModal } from "./modals/MonsterBrowserModal";

type CachedMonsterFrontmatterParse = {
  mtime: number;
  result: ReturnType<typeof parseFrontmatter>;
};

export default class ShadowdarkStatblocksPlugin extends Plugin {
  settings!: ShadowdarkStatblocksSettings;
  private renderGeneration = 0;
  private autoPreviewedLeafFiles = new WeakMap<MarkdownView, string>();
  private parsedMonsterCache = new Map<string, CachedMonsterFrontmatterParse>();
  private async renderMonsterInProcessedPreview(
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    if (!this.settings.renderFrontmatterMonsters) return;

    if (!el.classList.contains("mod-frontmatter")) {
      return;
    }

    if (el.getAttribute("data-sd-processed-preview") === "true") {
      return;
    }

    const sourcePath = ctx.sourcePath;
    if (!sourcePath) return;

    const file = this.app.vault.getAbstractFileByPath(sourcePath);
    if (!(file instanceof TFile)) return;

    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter as Record<string, unknown> | undefined;

    if (!frontmatter || frontmatter.shadowdarkType !== "monster") {
      return;
    }

    const result = this.getCachedMonsterParse(file, frontmatter);
    if (!result.success || !result.data) return;

    el.setAttribute("data-sd-processed-preview", "true");
    el.innerHTML = "";
    el.classList.remove("mod-frontmatter", "mod-ui", "el-pre");
    el.classList.add("sd-monster-embed-host");

    const wrapper = document.createElement("div");
    wrapper.className = "sd-monster-embed-wrapper";
    wrapper.setAttribute("data-source-path", file.path);

    renderMonsterBlock(wrapper, result.data, this.settings, result.warnings);
    el.appendChild(wrapper);
  }
  private getCachedMonsterParse(
    file: TFile,
    frontmatter: Record<string, unknown>
  ): ReturnType<typeof parseFrontmatter> {
    const cached = this.parsedMonsterCache.get(file.path);

    if (cached && cached.mtime === file.stat.mtime) {
      return cached.result;
    }

    const result = parseFrontmatter(frontmatter);
    this.parsedMonsterCache.set(file.path, {
      mtime: file.stat.mtime,
      result
    });

    return result;
  }
  private applyLastUsedSource(monster: ShadowdarkMonster): ShadowdarkMonster {
    if (!this.settings.lastUsedMonsterSource?.trim()) {
      return monster;
    }

    const currentSource = monster.source?.trim() ?? "";

    // Only override placeholder/default import values.
    if (
      !currentSource ||
      currentSource === "Imported from clipboard" ||
      currentSource === "Core Rules"
    ) {
      return {
        ...monster,
        source: this.settings.lastUsedMonsterSource
      };
    }

    return monster;
  }
  private countStatAnchors(text: string): number {
    const matches = text.match(/\bAC\b[\s\S]{0,120}?\bHP\b[\s\S]{0,120}?\bATK\b/gi);
    return matches ? matches.length : 0;
  }
  private async rememberLastUsedSource(source: string): Promise<void> {
    const trimmed = source.trim();
    if (!trimmed) return;

    if (this.settings.lastUsedMonsterSource === trimmed) return;

    this.settings.lastUsedMonsterSource = trimmed;
    await this.savePluginSettings();
  }
  private async importMultipleFromClipboard(): Promise<void> {
    let clipboardText = "";

    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (error) {
      console.error("Clipboard read error:", error);
      new Notice("Could not read clipboard.");
      return;
    }

    const blocks = splitRawShadowdarkBlocks(clipboardText);

    if (blocks.length === 0) {
      new Notice("No monster blocks detected.");
      return;
    }

    new Notice(`Detected ${blocks.length} potential monsters...`);

    await this.runBulkImportFlow(blocks);
  }
  private async runBulkImportFlow(blocks: string[]): Promise<void> {
    let importedCount = 0;
    let skippedCount = 0;
    let parseFailedCount = 0;
    let combinedBlockSkippedCount = 0;
    let cancelled = false;

    const importedNames: string[] = [];
    const skippedNames: string[] = [];
    const parseFailedNames: string[] = [];
    const combinedSkippedNames: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      const statAnchorCount = this.countStatAnchors(block);
      if (statAnchorCount > 1) {
        combinedBlockSkippedCount++;
        combinedSkippedNames.push(`Block ${i + 1}`);
        new Notice(`Skipping block ${i + 1}: looks like multiple monsters were combined.`);
        continue;
      }

      const result = parseRawShadowdarkText(block);

      if (!result.success || !result.data) {
        parseFailedCount++;
        parseFailedNames.push(`Block ${i + 1}`);
        new Notice(`Skipping block ${i + 1}: parse failed`);
        continue;
      }

      const suggestedTags = await this.getSuggestedTags();
      const suggestedOtherSources = await this.getSuggestedOtherSources();

      const monsterWithLastSource = this.applyLastUsedSource(result.data);
      const monsterWithSmartTags = this.applySmartDefaultTags(monsterWithLastSource);
      const monsterName = monsterWithSmartTags.name || `Block ${i + 1}`;

      const action = await new Promise<"confirm" | "skip" | "cancel">((resolve) => {
        let finalAction: "confirm" | "skip" | "cancel" = "cancel";

        const modal = new ImportPreviewModal(this.app, {
          monster: monsterWithSmartTags,
          warnings: result.warnings,
          mode: "import",
          progressLabel: `Reviewing ${i + 1} of ${blocks.length}: ${monsterWithSmartTags.name}`,
          suggestedTags,
          suggestedOtherSources,
          onConfirm: async (monster) => {
            finalAction = "confirm";
            await this.rememberLastUsedSource(monster.source);
            await this.createImportedMonsterCopy(monster, result.warnings);
          },
          onSkip: () => {
            finalAction = "skip";
          }
        });

        const originalOnClose = modal.onClose.bind(modal);
        modal.onClose = () => {
          originalOnClose();
          resolve(finalAction);
        };

        modal.open();
      });

      if (action === "confirm") {
        importedCount++;
        importedNames.push(monsterName);
      } else if (action === "skip") {
        skippedCount++;
        skippedNames.push(monsterName);
      } else if (action === "cancel") {
        cancelled = true;
        new Notice("Bulk import cancelled.");
        break;
      }
    }

    const formatList = (label: string, items: string[]) => {
      if (items.length === 0) return null;

      const preview = items.slice(0, 4).join(", ");
      const extra = items.length > 4 ? ` +${items.length - 4} more` : "";

      return `${label}: ${items.length} (${preview}${extra})`;
    };
    const summaryParts = [
      formatList("Imported", importedNames),
      formatList("Skipped", skippedNames),
      formatList("Parse failed", parseFailedNames),
      formatList("Combined-block skips", combinedSkippedNames)
    ].filter(Boolean);

    if (parseFailedCount > 0) {
      summaryParts.push(`Parse failed: ${parseFailedCount}`);
    }

    if (combinedBlockSkippedCount > 0) {
      summaryParts.push(`Combined-block skips: ${combinedBlockSkippedCount}`);
    }

    const summaryPrefix = cancelled ? "Bulk import stopped." : "Bulk import complete.";
    new Notice(`${summaryPrefix} ${summaryParts.join(" | ")}`, 10000);
  }
  async onload(): Promise<void> {
    await this.loadPluginSettings();

    this.addSettingTab(new ShadowdarkStatblocksSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      "shadowdark-monster",
      (source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
        const result = parseCodeBlock(source);

        if (!result.success || !result.data) {
          const errorBox = el.createDiv({ cls: "sd-monster-error-box" });
          errorBox.createDiv({
            text: "Shadowdark monster parse error",
            cls: "sd-monster-error-title"
          });

          for (const error of result.errors) {
            errorBox.createDiv({
              text: error,
              cls: "sd-monster-error"
            });
          }

          return;
        }

        renderMonsterBlock(el, result.data, this.settings, result.warnings);
      }
    );

    this.registerEvent(
    this.app.workspace.on("active-leaf-change", () => {
    void this.renderAllMonsterViews();
  })
);

this.registerMarkdownPostProcessor((el, ctx) => {
  void this.renderMonsterInProcessedPreview(el, ctx);
});

this.registerEvent(
  this.app.workspace.on("file-open", () => {
    void this.ensureMonsterViewsInPreview();
    void this.renderAllMonsterViews();
  })
);

this.registerEvent(
  this.app.workspace.on("layout-change", () => {
    void this.renderAllMonsterViews();
  })
);

this.registerEvent(
  this.app.metadataCache.on("changed", () => {
    void this.renderAllMonsterViews();
  })
);

    this.addCommand({
      id: "insert-shadowdark-monster-block",
      name: "Insert Shadowdark monster block",
      editorCallback: (editor) => {
        const template = [
          "```shadowdark-monster",
          "name: Goblin Sneak",
          "level: 1",
          "alignment: C",
          "ac: 13",
          "hp: 5",
          "mv: near",
          "atk:",
          "  - 1 Dagger +2 (1d4)",
          "str: -1",
          "dex: +2",
          "con: +0",
          "int: +0",
          "wis: -1",
          "cha: -1",
          "traits:",
          "  - Sneaky",
          "  - Dark-adapted",
          "description: A wiry goblin that stalks the edges of torchlight.",
          "source: Homebrew",
          "tags:",
          "  - shadowdark",
          "  - goblin",
          "```"
        ].join("\n");

        editor.replaceSelection(template);
      }
    });

    this.addCommand({
      id: "create-shadowdark-monster-note",
      name: "Create Shadowdark monster note",
      callback: async () => {
        await this.createMonsterNote();
      }
    });

    this.addCommand({
      id: "import-shadowdark-monster-from-clipboard",
      name: "Import Shadowdark monster from clipboard",
      callback: async () => {
        await this.importMonsterFromClipboard();
      }
    });

    this.addCommand({
      id: "import-shadowdark-monster-from-selection",
      name: "Import Shadowdark monster from selected text",
      editorCallback: async (editor: Editor) => {
        await this.importMonsterFromSelection(editor);
      }
    });

    this.addCommand({
      id: "edit-current-shadowdark-monster",
      name: "Edit current Shadowdark monster",
      callback: async () => {
        await this.editCurrentMonsterNote();
      }
    });

    this.addCommand({
      id: "import-multiple-shadowdark-monsters",
      name: "Import multiple Shadowdark monsters from clipboard",
      callback: async () => {
        await this.importMultipleFromClipboard();
      }
    });
    this.addCommand({
      id: "open-monster-browser",
      name: "Open Monster Browser",
      callback: () => {
        new MonsterBrowserModal(this.app, this).open();
      }
    });

    window.setTimeout(() => {
      void this.ensureMonsterViewsInPreview();
      void this.renderAllMonsterViews();
    }, 100);
  }

  onunload(): void {
  const leaves = this.app.workspace.getLeavesOfType("markdown");

  for (const leaf of leaves) {
    const view = leaf.view;
    if (view instanceof MarkdownView) {
      this.removeExistingFrontmatterRender(view);
      this.showProperties(view);
    }
  }
  this.parsedMonsterCache.clear();

}

  async loadPluginSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async savePluginSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async refreshMonsterView(): Promise<void> {
  await this.renderAllMonsterViews();
}

  private async createMonsterNote(): Promise<void> {
    const folderPath = normalizePath(this.settings.monsterFolder);

    await this.ensureFolderExists(folderPath);

    const baseName = "New Monster";
    const filePath = await this.getUniqueFilePath(folderPath, `${baseName}.md`);
    const content = buildMonsterTemplate(baseName);

    const file = await this.app.vault.create(filePath, content);
    await this.app.workspace.getLeaf(true).openFile(file);

    new Notice(`Created monster note: ${file.basename}`);
  }

  private async importMonsterFromClipboard(): Promise<void> {
    let clipboardText = "";

    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (error) {
      console.error("Shadowdark Statblocks clipboard read error:", error);
      new Notice("Could not read clipboard.");
      return;
    }
    await this.openImportPreviewFromText(clipboardText);
  }

  async getSuggestedOtherSources(): Promise<string[]> {
    return getSuggestedOtherSources(this.app, this.settings.monsterFolder);
  }

private applySmartDefaultTags(monster: ShadowdarkMonster): ShadowdarkMonster {
  const existingTags = new Set(
    (monster.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
  );

  const textBlob = [
    monster.name,
    monster.description,
    ...(monster.traits ?? []),
    ...(monster.specials ?? []),
    ...(monster.spells ?? [])
  ]
    .join(" ")
    .toLowerCase();

  const mv = (monster.mv ?? "").toLowerCase();

  const addTag = (tag: string) => {
    existingTags.add(tag);
  };

  const addIfMatch = (tag: string, patterns: RegExp[]) => {
    if (patterns.some((pattern) => pattern.test(textBlob))) {
      addTag(tag);
    }
  };

  addIfMatch("undead", [/\bundead\b/, /\bskeleton\b/, /\bzombie\b/, /\bghoul\b/, /\bvampire\b/, /\blich\b/, /\bwight\b/]);
  addIfMatch("dragon", [/\bdragon\b/, /\bdrake\b/, /\bwyrm\b/]);
  addIfMatch("demon", [/\bdemon\b/]);
  addIfMatch("devil", [/\bdevil\b/]);
  addIfMatch("construct", [/\bconstruct\b/, /\bgolem\b/, /\banimated armor\b/, /\bclockwork\b/]);
  addIfMatch("ooze", [/\booze\b/, /\bslime\b/, /\bjelly\b/, /\bpudding\b/, /\bichor\b/]);
  addIfMatch("goblin", [/\bgoblin\b/]);
  addIfMatch("orc", [/\borc\b/]);
  addIfMatch("troll", [/\btroll\b/]);
  addIfMatch("wolf", [/\bwolf\b/]);
  addIfMatch("giant", [/\bgiant\b/]);

  if (/\bfly\b/.test(mv)) {
    addTag("flying");
  }

  if (/\bswim\b/.test(mv) || /\baquatic\b/.test(textBlob) || /\bwater\b/.test(textBlob)) {
    addTag("aquatic");
  }

  if ((monster.spells ?? []).length > 0) {
    addTag("spellcaster");
  }

  return {
    ...monster,
    tags: [...existingTags].sort((a, b) => a.localeCompare(b))
  };
}

  private async importMonsterFromSelection(editor: Editor): Promise<void> {
    const selectedText = editor.getSelection().trim();

    if (!selectedText) {
      new Notice("No text selected.");
      return;
    }

    await this.openImportPreviewFromText(selectedText);
  }

  private async openImportPreviewFromText(sourceText: string): Promise<void> {
    const result = parseRawShadowdarkText(sourceText);

    if (!result.success || !result.data) {
      const message =
        result.errors.length > 0
          ? result.errors[0]
          : "Could not parse monster text.";
      new Notice(message, 6000);
      return;
    }

    const suggestedTags = await this.getSuggestedTags();
    const suggestedOtherSources = await this.getSuggestedOtherSources();

    const monsterWithLastSource = this.applyLastUsedSource(result.data);
    const monsterWithSmartTags = this.applySmartDefaultTags(monsterWithLastSource);

    const modal = new ImportPreviewModal(this.app, {
      monster: monsterWithSmartTags,
      warnings: result.warnings,
      mode: "import",
      suggestedTags,
      suggestedOtherSources,
      onConfirm: async (monster) => {
        await this.rememberLastUsedSource(monster.source);
        await this.createImportedMonsterNote(monster, result.warnings);
      }
    });

    modal.open();
  }
  async getSuggestedTags(): Promise<string[]> {
    return getSuggestedTags(this.app, this.settings.monsterFolder);
  }
  async getAllMonsterIndexEntries() {
    return getAllMonsterIndexEntries(this.app, this.settings.monsterFolder);
  }
  private async createImportedMonsterNote(
    monster: ShadowdarkMonster,
    warnings: string[]
  ): Promise<void> {
    const folderPath = normalizePath(this.settings.monsterFolder);
    await this.ensureFolderExists(folderPath);

    const safeName = (monster.name || "Imported Monster").trim();

    const existingMonsterFile = this.app.vault
      .getMarkdownFiles()
      .find((file) => {
        const inMonsterFolder =
          file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`;

        if (!inMonsterFolder) return false;

        return file.basename.trim().toLowerCase() === safeName.toLowerCase();
      });

    if (existingMonsterFile instanceof TFile) {
      const existingContent = await this.app.vault.read(existingMonsterFile);
      const existingFrontmatter = this.extractFrontmatter(existingContent);
      const canOverwrite = existingFrontmatter?.shadowdarkType === "monster";

      const modal = new DuplicateMonsterModal(this.app, {
        monsterName: safeName,
        existingFileName: existingMonsterFile.basename,
        canOverwrite,
        onOverwrite: canOverwrite
          ? async () => {
              await this.updateExistingMonsterNote(existingMonsterFile, monster);

              if (warnings.length > 0) {
                new Notice(
                  `Updated ${existingMonsterFile.basename} with ${warnings.length} warning(s). Review the note.`,
                  7000
                );
              } else {
                new Notice(`Updated monster: ${existingMonsterFile.basename}`);
              }
            }
          : undefined,
        onCreateCopy: async () => {
          await this.createImportedMonsterCopy(monster, warnings);
        }
      });

      modal.open();
      return;
    }

    await this.createImportedMonsterCopy(monster, warnings);
  }

private async createImportedMonsterCopy(
  monster: ShadowdarkMonster,
  warnings: string[]
): Promise<void> {
  const folderPath = normalizePath(this.settings.monsterFolder);
  await this.ensureFolderExists(folderPath);

  const safeName = monster.name || "Imported Monster";
  const filePath = await this.getUniqueFilePath(folderPath, `${safeName}.md`);
  const content = buildMonsterNoteContent(monster);

  const file = await this.app.vault.create(filePath, content);
  await this.app.workspace.getLeaf(true).openFile(file);

  if (warnings.length > 0) {
    new Notice(
      `Imported ${file.basename} with ${warnings.length} warning(s). Review the note.`,
      7000
    );
  } else {
    new Notice(`Imported monster: ${file.basename}`);
  }
}

  private async editCurrentMonsterNote(): Promise<void> {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) {
    new Notice("No active markdown note.");
    return;
  }

  const file = view.file;
  if (!(file instanceof TFile)) {
    new Notice("No active file to edit.");
    return;
  }

  const content = await this.app.vault.read(file);
  const parsedFrontmatter = this.extractFrontmatter(content);

  if (!parsedFrontmatter || parsedFrontmatter.shadowdarkType !== "monster") {
    new Notice("Current note is not a Shadowdark monster.");
    return;
  }

  const result = this.getCachedMonsterParse(file, parsedFrontmatter);
  if (!result.success || !result.data) {
    new Notice("Could not parse current monster note.");
    return;
  }

  const suggestedTags = await this.getSuggestedTags();
  const suggestedOtherSources = await this.getSuggestedOtherSources();

  const modal = new ImportPreviewModal(this.app, {
    monster: result.data,
    warnings: [],
    mode: "edit",
    suggestedTags,
    suggestedOtherSources,
    onConfirm: async (monster) => {
      await this.rememberLastUsedSource(monster.source);
      await this.updateExistingMonsterNote(file, monster);
    }
  });

  modal.open();
}

private async updateExistingMonsterNote(
  file: TFile,
  monster: ShadowdarkMonster
): Promise<void> {
  const existingContent = await this.app.vault.read(file);
  const body = this.extractBodyAfterFrontmatter(existingContent);

  const updatedContent = buildMonsterNoteContent(monster, body);
  await this.app.vault.modify(file, updatedContent);
  this.parsedMonsterCache.delete(file.path);

  new Notice(`Updated monster: ${file.basename}`);
  await this.refreshMonsterView();
}

private extractBodyAfterFrontmatter(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match?.[1] ?? "";
}

  private async ensureFolderExists(folderPath: string): Promise<void> {
    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);

      if (!existing) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }

  private async getUniqueFilePath(folderPath: string, fileName: string): Promise<string> {
    const dotIndex = fileName.lastIndexOf(".");
    const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
    const ext = dotIndex >= 0 ? fileName.slice(dotIndex) : "";

    let candidate = `${folderPath}/${base}${ext}`;
    let counter = 2;

    while (this.app.vault.getAbstractFileByPath(candidate)) {
      candidate = `${folderPath}/${base} ${counter}${ext}`;
      counter++;
    }

    return candidate;
  }

  private async renderAllMonsterViews(): Promise<void> {
    const myGeneration = ++this.renderGeneration;

    const leaves = this.app.workspace.getLeavesOfType("markdown");
    const views = leaves
      .map((leaf) => leaf.view)
      .filter((view): view is MarkdownView => view instanceof MarkdownView);

    for (const view of views) {
      await this.renderMonsterView(view, myGeneration);
    }
  }

private async renderMonsterView(
  view: MarkdownView,
  generation: number
): Promise<void> {
  this.removeExistingFrontmatterRender(view);
  this.showProperties(view);

  if (!this.settings.renderFrontmatterMonsters) return;
  if (view.getMode() !== "preview") return;

  const file = view.file;
  if (!(file instanceof TFile)) return;

  const content = await this.app.vault.read(file);

  if (generation !== this.renderGeneration) return;

  const parsedFrontmatter = this.extractFrontmatter(content);
  if (!parsedFrontmatter) return;
  if (parsedFrontmatter.shadowdarkType !== "monster") return;

  if (this.settings.hideMonsterProperties) {
    this.hideProperties(view);
  }
}

private async ensureMonsterViewInPreview(view: MarkdownView): Promise<void> {
  const file = view.file;
  if (!(file instanceof TFile)) return;

  const content = await this.app.vault.read(file);
  const parsedFrontmatter = this.extractFrontmatter(content);

  if (!parsedFrontmatter || parsedFrontmatter.shadowdarkType !== "monster") {
    return;
  }

  const alreadyAutoPreviewedForThisFile = this.autoPreviewedLeafFiles.get(view) === file.path;
  if (alreadyAutoPreviewedForThisFile) {
    return;
  }

  if (view.getMode() === "preview") {
    this.autoPreviewedLeafFiles.set(view, file.path);
    return;
  }

  window.setTimeout(() => {
    try {
      const leaf = this.app.workspace
        .getLeavesOfType("markdown")
        .find((l) => l.view === view);

      if (!leaf) return;

      void leaf.setViewState({
        type: "markdown",
        state: {
          ...(view.getState() as any),
          mode: "preview",
          file: file.path
        }
      });

      this.autoPreviewedLeafFiles.set(view, file.path);
    } catch (err) {
      console.error("Failed to switch to preview mode:", err);
    }
  }, 50);
}

private async ensureMonsterViewsInPreview(): Promise<void> {
  const leaves = this.app.workspace.getLeavesOfType("markdown");
  const views = leaves
    .map((leaf) => leaf.view)
    .filter((view): view is MarkdownView => view instanceof MarkdownView);

  for (const view of views) {
    await this.ensureMonsterViewInPreview(view);
  }
}

  private hideProperties(view: MarkdownView): void {
    const propertiesEl = view.containerEl.querySelector(".metadata-container");
    if (propertiesEl instanceof HTMLElement) {
      propertiesEl.classList.add("sd-monster-hide-properties");
    }
  }

  private showProperties(view: MarkdownView): void {
    const hiddenProperties = view.containerEl.querySelectorAll(".sd-monster-hide-properties");
    for (const el of hiddenProperties) {
      el.classList.remove("sd-monster-hide-properties");
    }
  }

  private removeExistingFrontmatterRender(view: MarkdownView): void {
    const existing = view.containerEl.querySelectorAll(".sd-monster-frontmatter-wrapper");
    for (const el of existing) {
      el.remove();
    }
  }

  private extractFrontmatter(content: string): Record<string, unknown> | null {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    try {
      const parsed = parseYaml(match[1]);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed as Record<string, unknown>;
    } catch (error) {
      console.error("Shadowdark Statblocks frontmatter parse error:", error);
      return null;
    }
  }

  private escapeAttribute(value: string): string {
    return value.replace(/"/g, "&quot;");
  }
}