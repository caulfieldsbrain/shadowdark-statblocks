import { parseYaml } from "obsidian";
import { ParseResult, ShadowdarkMonster } from "../types";
import { normalizeMonster } from "./normalizeMonster";

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseCodeBlock(source: string): ParseResult<ShadowdarkMonster> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed: unknown = parseYaml(source);

    if (!isRecord(parsed)) {
      return {
        success: false,
        errors: ["Code block did not contain a valid YAML object."],
        warnings
      };
    }

    const monster = normalizeMonster(parsed);

    if (!monster.name || monster.name === "Unnamed Monster") {
      warnings.push("Monster is missing a name.");
    }

    if (!monster.ac || monster.ac === "?") {
      warnings.push("Monster is missing AC.");
    }

    if (!monster.hp || monster.hp === "?") {
      warnings.push("Monster is missing HP.");
    }

    if (monster.atk.length === 0) {
      warnings.push("Monster has no attacks listed.");
    }

    return {
      success: true,
      data: monster,
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