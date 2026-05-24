export function buildDiceRollerFormula(
  formula: string,
  displayText?: string
): string {
  const cleaned = formula.trim();

  if (!cleaned) {
    return "";
  }

  if (displayText?.trim()) {
    return `\`dice: ${cleaned}|nodice|text(${displayText.trim()})\``;
  }

  return `\`dice: ${cleaned}|nodice\``;
}

export function extractAttackBonus(text: string): string | null {
  const match = text.match(/([+-]\d+)/);

  return match?.[1] ?? null;
}

export function extractDamageFormula(text: string): string | null {
  const match = text.match(/\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b/i);

  return match?.[1].replace(/\s+/g, "") ?? null;
}