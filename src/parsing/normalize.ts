import { ShadowdarkAttack } from "../types";

export function asString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  return fallback;
}

export function normalizeModifier(value: unknown, fallback = "+0"): string {
  const raw = asString(value, fallback);
  if (!raw) return fallback;
  if (/^[+-]\d+$/.test(raw)) return raw;
  if (/^\d+$/.test(raw)) return `+${raw}`;
  if (/^-\d+$/.test(raw)) return raw;
  return raw;
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeAttack(item: unknown): ShadowdarkAttack | null {
  if (typeof item === "string") {
    return {
      name: item.trim(),
      raw: item.trim()
    };
  }

  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const name = asString(obj.name);
    if (!name) return null;

    return {
      name,
      bonus: asString(obj.bonus),
      damage: asString(obj.damage),
      range: asString(obj.range),
      notes: asString(obj.notes)
    };
  }

  return null;
}

export function normalizeAttacks(value: unknown): ShadowdarkAttack[] {
  if (Array.isArray(value)) {
    return value
      .map(normalizeAttack)
      .filter((a): a is ShadowdarkAttack => a !== null);
  }

  if (typeof value === "string" && value.trim()) {
    return [{ name: value.trim(), raw: value.trim() }];
  }

  return [];
}

