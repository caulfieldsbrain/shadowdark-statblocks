import { parseYaml } from "obsidian";
import { ParseResult, ShadowdarkEntity, ShadowdarkMonster, ShadowdarkPlayer } from "../types";
import { normalizeMonster } from "./normalizeMonster";
import { normalizePlayer } from "./normalizePlayer";

export function parseCodeBlock(source: string): ParseResult<ShadowdarkEntity> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = parseYaml(source);

    if (!parsed || typeof parsed !== "object") {
      return {
        success: false,
        errors: ["Code block did not contain a valid YAML object."],
        warnings
      };
    }

    let entity: ShadowdarkEntity
    if (parsed.shadowdarkType === "monster") {
      entity = normalizeMonster(parsed as Partial<ShadowdarkMonster>);
    } else {
      entity = normalizePlayer(parsed as Partial<ShadowdarkPlayer>);
    }

    if (!entity.name || entity.name === "Unnamed Monster") {
      warnings.push("Monster is missing a name.");
    }

    if (!entity.ac || entity.ac === "?") {
      warnings.push("Monster is missing AC.");
    }

    if (!entity.hp || entity.hp === "?") {
      warnings.push("Monster is missing HP.");
    }

    if (entity.atk.length === 0) {
      warnings.push("Monster has no attacks listed.");
    }

    return {
      success: true,
      data: entity,
      errors,
      warnings
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown parse error.";

    return {
      success: false,
      errors: [`YAML parse error: ${message}`],
      warnings
    };
  }
}
