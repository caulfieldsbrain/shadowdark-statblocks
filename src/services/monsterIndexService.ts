import { App, TFile, normalizePath, parseYaml } from "obsidian";

export type MonsterIndexEntry = {
  file: TFile;
  name: string;
  level: string;
  alignment: string;
  source: string;
  tags: string[];
  frontmatter: Record<string, unknown>;
};

function extractFrontmatter(content: string): Record<string, unknown> | null {
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

export async function getSuggestedTags(
  app: App,
  monsterFolder: string
): Promise<string[]> {
  const folderPath = normalizePath(monsterFolder);
  const files = app.vault
    .getMarkdownFiles()
    .filter(
      (file) =>
        file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`
    );

  const tags = new Set<string>();

  for (const file of files) {
    const content = await app.vault.read(file);
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter || frontmatter.shadowdarkType !== "monster") continue;

    const rawTags = frontmatter.tags;
    if (Array.isArray(rawTags)) {
      for (const tag of rawTags) {
        if (typeof tag === "string" && tag.trim()) {
          tags.add(tag.trim().toLowerCase());
        }
      }
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b));
}

export async function getSuggestedOtherSources(
  app: App,
  monsterFolder: string
): Promise<string[]> {
  const folderPath = normalizePath(monsterFolder);
  const files = app.vault
    .getMarkdownFiles()
    .filter(
      (file) =>
        file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`
    );

  const builtInSources = new Set([
    "Core Rules",
    "Cursed Scroll 1",
    "Cursed Scroll 2",
    "Cursed Scroll 3",
    "Homebrew",
    "Other"
  ]);

  const sources = new Set<string>();

  for (const file of files) {
    const content = await app.vault.read(file);
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter || frontmatter.shadowdarkType !== "monster") continue;

    const rawSource = frontmatter.source;
    if (typeof rawSource === "string") {
      const source = rawSource.trim();
      if (source && !builtInSources.has(source)) {
        sources.add(source);
      }
    }
  }

  return [...sources].sort((a, b) => a.localeCompare(b));
}

export async function getAllMonsterIndexEntries(
  app: App,
  monsterFolder: string
): Promise<MonsterIndexEntry[]> {
  const folderPath = normalizePath(monsterFolder);

  const files = app.vault
    .getMarkdownFiles()
    .filter(
      (file) =>
        file.path.startsWith(`${folderPath}/`) || file.path === `${folderPath}.md`
    );

  const results: MonsterIndexEntry[] = [];

  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter as Record<string, unknown> | undefined;

    if (!frontmatter || frontmatter.shadowdarkType !== "monster") continue;

    results.push({
      file,
      name: typeof frontmatter.name === "string" ? frontmatter.name : file.basename,
      level: frontmatter.level != null ? String(frontmatter.level) : "",
      alignment:
        typeof frontmatter.alignment === "string" ? frontmatter.alignment : "",
      source: typeof frontmatter.source === "string" ? frontmatter.source : "",
      tags: Array.isArray(frontmatter.tags)
        ? frontmatter.tags.filter((t): t is string => typeof t === "string")
        : [],
      frontmatter
    });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}