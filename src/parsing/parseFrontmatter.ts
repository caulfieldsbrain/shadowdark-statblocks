import { ParseResult, ShadowdarkEntity, ShadowdarkMonster, ShadowdarkPlayer } from "../types";
import { normalizeMonster } from "./normalizeMonster";
import { normalizePlayer } from "./normalizePlayer";

export function parseFrontmatter(
  frontmatter: Record<string, unknown>,
): ParseResult<ShadowdarkMonster | ShadowdarkPlayer> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!frontmatter || typeof frontmatter !== "object") {
    return {
      success: false,
      errors: ["No valid frontmatter found."],
      warnings
    };
  }

  let entity: ShadowdarkEntity
  if (frontmatter.shadowdarkType === "monster") {
    entity = normalizeMonster(frontmatter as Partial<ShadowdarkMonster>);
  } else {
    entity = normalizePlayer(frontmatter as Partial<ShadowdarkPlayer>);
  }

  if (!entity.name || entity.name.startsWith("Unnamed")) {
    warnings.push("Missing a name.");
  }

  if (!entity.ac || entity.ac === "?") {
    warnings.push("Missing AC.");
  }

  if (!entity.hp || entity.hp === "?") {
    warnings.push("Missing HP.");
  }

  if (entity.atk.length === 0) {
    warnings.push("No attacks listed.");
  }

  return {
    success: true,
    data: entity,
    errors,
    warnings
  };
}
