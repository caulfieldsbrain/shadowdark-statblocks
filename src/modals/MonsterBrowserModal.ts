import { App, Modal,} from "obsidian";
import type ShadowdarkStatblocksPlugin from "../main";
import { parseFrontmatter } from "../parsing/parseFrontmatter";
import { renderMonsterBlock } from "../render/renderMonsterBlock";
import { Menu } from "obsidian";
import { type MonsterIndexEntry } from "../services/monsterIndexService";

export class MonsterBrowserModal extends Modal {
    private plugin: ShadowdarkStatblocksPlugin;
    private allMonsters: MonsterIndexEntry[] = [];
    private filteredMonsters: MonsterIndexEntry[] = [];

    private searchText = "";
    private selectedSource = "";
    private selectedTag = "";
    private selectedMaxLevel = "";

    private resultsEl!: HTMLDivElement;

    private hoverCardEl!: HTMLDivElement;
    private hoverPreviewEl!: HTMLDivElement;
    private hoverHideTimeout: number | null = null;
    private hoverMouseX = 0;
    private hoverMouseY = 0;       
    private hoverShowTimeout: number | null = null;                                         

  constructor(app: App, plugin: ShadowdarkStatblocksPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    const { contentEl, titleEl } = this;
    titleEl.setText("Monster Browser");
    contentEl.empty();
    contentEl.addClass("sd-monster-browser-modal");
    contentEl.style.minHeight = "0";

    this.allMonsters = await this.plugin.getAllMonsterIndexEntries();
    this.filteredMonsters = [...this.allMonsters];

    const controlsEl = contentEl.createDiv({ cls: "sd-monster-browser-controls" });

    const createFilterCard = (labelText: string): HTMLDivElement => {
      const card = controlsEl.createDiv({ cls: "sd-monster-browser-filter" });
      card.createEl("label", {
        cls: "sd-monster-browser-filter-label",
        text: labelText
      });
      return card;
    };

    // Search
    const searchCard = createFilterCard("Search");
    const searchInputEl = searchCard.createEl("input", {
      type: "text",
      placeholder: "Search by name...",
      cls: "sd-monster-browser-input"
    });
    searchInputEl.value = this.searchText;
    searchInputEl.addEventListener("input", () => {
      this.searchText = searchInputEl.value.trim().toLowerCase();
      this.applyFilters();
    });

    // Source
    const sourceCard = createFilterCard("Source");
    const sourceSelectEl = sourceCard.createEl("select", {
      cls: "sd-monster-browser-select"
    });

    const allSources = Array.from(
      new Set(this.allMonsters.map((m) => m.source).filter(Boolean))
    ).sort((a: string, b: string) => a.localeCompare(b));

    sourceSelectEl.appendChild(new Option("All", ""));
    for (const source of allSources) {
      sourceSelectEl.appendChild(new Option(source, source));
    }
    sourceSelectEl.value = this.selectedSource;
    sourceSelectEl.addEventListener("change", () => {
      this.selectedSource = sourceSelectEl.value;
      this.applyFilters();
    });

    // Tag
    const tagCard = createFilterCard("Tag");
    const tagSelectEl = tagCard.createEl("select", {
      cls: "sd-monster-browser-select"
    });

    const allTagsSet = new Set<string>();
    for (const monster of this.allMonsters) {
      for (const tag of monster.tags) {
        if (tag) allTagsSet.add(tag);
      }
    }
    const allTags = Array.from(allTagsSet).sort((a: string, b: string) =>
      a.localeCompare(b)
    );

    tagSelectEl.appendChild(new Option("All", ""));
    for (const tag of allTags) {
      tagSelectEl.appendChild(new Option(tag, tag));
    }
    tagSelectEl.value = this.selectedTag;
    tagSelectEl.addEventListener("change", () => {
      this.selectedTag = tagSelectEl.value;
      this.applyFilters();
    });

    // Max Level
    const maxLevelCard = createFilterCard("Max Level");
    const maxLevelSelectEl = maxLevelCard.createEl("select", {
      cls: "sd-monster-browser-select"
    });

    maxLevelSelectEl.appendChild(new Option("Any", ""));
    for (let i = 0; i <= 20; i++) {
      maxLevelSelectEl.appendChild(new Option(String(i), String(i)));
    }
    maxLevelSelectEl.value = this.selectedMaxLevel;
    maxLevelSelectEl.addEventListener("change", () => {
      this.selectedMaxLevel = maxLevelSelectEl.value;
      this.applyFilters();
    });

    // Actions
    const actionsEl = contentEl.createDiv({ cls: "sd-monster-browser-actions" });
    const clearButton = actionsEl.createEl("button", {
      cls: "mod-cta sd-monster-browser-clear-button",
      text: "Clear Filters"
    });

    clearButton.addEventListener("click", () => {
      this.searchText = "";
      this.selectedSource = "";
      this.selectedTag = "";
      this.selectedMaxLevel = "";

      searchInputEl.value = "";
      sourceSelectEl.value = "";
      tagSelectEl.value = "";
      maxLevelSelectEl.value = "";

      this.applyFilters();
    });

    // Results container
    this.resultsEl = contentEl.createDiv({ cls: "sd-monster-browser-results" });

    this.resultsEl.addEventListener("scroll", () => {
        this.hideHoverCard();
    });

    // Hover card
    this.hoverCardEl = contentEl.createDiv({ cls: "sd-monster-browser-hover-card" });
    this.hoverPreviewEl = this.hoverCardEl.createDiv({
      cls: "sd-monster-browser-hover-card-inner"
    });

    this.hoverCardEl.addEventListener("mouseenter", () => {
      this.clearHoverHideTimeout();
    });

    this.hoverCardEl.addEventListener("mouseleave", () => {
      this.scheduleHideHoverCard();
    });

    this.renderResults();
  }

  onClose(): void {
    this.clearHoverHideTimeout();
    this.contentEl.empty();
  }

  private clearHoverHideTimeout(): void {
    if (this.hoverHideTimeout !== null) {
      window.clearTimeout(this.hoverHideTimeout);
      this.hoverHideTimeout = null;
    }
  }

  private scheduleHideHoverCard(): void {
    this.clearHoverHideTimeout();
    this.hoverHideTimeout = window.setTimeout(() => {
      this.hideHoverCard();
    }, 120);
  }

  private hideHoverCard(): void {
    if (this.hoverCardEl) {
      this.hoverCardEl.classList.remove("is-visible");
    }
  }

  private showHoverCard(monster: MonsterIndexEntry): void {
    const result = parseFrontmatter(monster.frontmatter);
    if (!result.success || !result.data) return;

    this.hoverPreviewEl.empty();
    renderMonsterBlock(
        this.hoverPreviewEl,
        result.data,
        this.plugin.settings,
        result.warnings
    );

    this.hoverCardEl.classList.add("is-visible");
    this.positionHoverCard();
    }

  private applyFilters(): void {
    this.filteredMonsters = this.allMonsters.filter((monster) => {
      const matchesSearch =
        !this.searchText || monster.name.toLowerCase().includes(this.searchText);

      const matchesSource =
        !this.selectedSource || monster.source === this.selectedSource;

      const matchesTag =
        !this.selectedTag || monster.tags.includes(this.selectedTag);

      const matchesLevel =
        !this.selectedMaxLevel ||
        (Number(monster.level) || 0) <= Number(this.selectedMaxLevel);

      return matchesSearch && matchesSource && matchesTag && matchesLevel;
    });

    this.renderResults();
  }
    private positionHoverCard(): void {
        if (!this.hoverCardEl.classList.contains("is-visible")) return;

        const offset = 16;
        const cardWidth = Math.min(420, Math.floor(window.innerWidth * 0.42));
        const cardHeight = Math.min(520, Math.floor(window.innerHeight * 0.7));

        let left = this.hoverMouseX + offset;
        let top = this.hoverMouseY + offset;

        if (left + cardWidth > window.innerWidth - 12) {
            left = this.hoverMouseX - cardWidth - offset;
        }

        if (left < 12) {
            left = 12;
        }

        if (top + cardHeight > window.innerHeight - 12) {
            top = window.innerHeight - cardHeight - 12;
        }

        if (top < 12) {
            top = 12;
        }

        this.hoverCardEl.style.left = `${left}px`;
        this.hoverCardEl.style.top = `${top}px`;
        }

  private renderResults(): void {
    this.resultsEl.empty();
    this.hideHoverCard();

    const summary = this.resultsEl.createDiv({ cls: "sd-monster-browser-summary" });
    summary.setText(`${this.filteredMonsters.length} monster(s)`);

    if (this.filteredMonsters.length === 0) {
      this.resultsEl.createDiv({
        cls: "sd-monster-browser-empty",
        text: "No monsters match those filters."
      });
      return;
    }

    for (const monster of this.filteredMonsters) {
      const row = this.resultsEl.createDiv({ cls: "sd-monster-browser-row" });

    row.addEventListener("mouseenter", (evt: MouseEvent) => {
        this.clearHoverHideTimeout();

        this.hoverMouseX = evt.clientX;
        this.hoverMouseY = evt.clientY;

        if (this.hoverShowTimeout) {
            window.clearTimeout(this.hoverShowTimeout);
        }

        this.hoverShowTimeout = window.setTimeout(() => {
            this.showHoverCard(monster);
        }, 120);
        });

        row.addEventListener("mousemove", (evt: MouseEvent) => {
        this.hoverMouseX = evt.clientX;
        this.hoverMouseY = evt.clientY;
        this.positionHoverCard();
     });

        row.addEventListener("mouseleave", () => {
            if (this.hoverShowTimeout) {
                window.clearTimeout(this.hoverShowTimeout);
                this.hoverShowTimeout = null;
            }

            this.scheduleHideHoverCard();
        });

      row.createDiv({
        cls: "sd-monster-browser-name",
        text: monster.name
      });

      const metaParts = [
        monster.level ? `LV ${monster.level}` : "",
        monster.alignment ? `AL ${monster.alignment}` : "",
        monster.source || ""
      ].filter(Boolean);

      row.createDiv({
        cls: "sd-monster-browser-meta",
        text: metaParts.join(" • ")
      });

      if (monster.tags.length > 0) {
        const tagsEl = row.createDiv({ cls: "sd-monster-browser-tags" });
        for (const tag of monster.tags) {
          tagsEl.createDiv({
            cls: "sd-monster-browser-tag",
            text: tag
          });
        }
      }

      row.addEventListener("click", async () => {
        await this.app.workspace.getLeaf(true).openFile(monster.file);
        this.close();
    });
    row.addEventListener("contextmenu", (evt: MouseEvent) => {
        evt.preventDefault();

        const menu = new Menu();

        menu.addItem((item) =>
            item
            .setTitle("Open")
            .onClick(async () => {
                await this.app.workspace.getLeaf(true).openFile(monster.file);
                this.close();
            })
        );

        menu.addItem((item) =>
            item
            .setTitle("Open to the right")
            .onClick(async () => {
                const leaf = this.app.workspace.getLeaf("split", "vertical");
                await leaf.openFile(monster.file);
            })
        );

        menu.addItem((item) =>
            item
            .setTitle("Copy link")
            .onClick(async () => {
                const link = `[[${monster.file.basename}]]`;
                await navigator.clipboard.writeText(link);
            })
        );
        menu.addItem((item) =>
            item
            .setTitle("Copy embed")
            .onClick(async () => {
                const embed = `![[${monster.file.basename}]]`;
                await navigator.clipboard.writeText(embed);
            })
        );
        menu.showAtMouseEvent(evt);
        });
    }
  }
}