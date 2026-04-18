const UPPERCASE_NON_NAME_WORDS = new Set([
  "AC",
  "HP",
  "ATK",
  "MV",
  "AL",
  "LV",
  "STR",
  "DEX",
  "CON",
  "INT",
  "WIS",
  "CHA",
  "DC",
  "ADV",
  "DISADV"
]);

function cleanNameToken(word: string): string {
  return word.replace(/[,'’\-]/g, "");
}

function isUppercaseNameToken(word: string): boolean {
  const cleaned = cleanNameToken(word);
  if (!cleaned) return false;
  if (UPPERCASE_NON_NAME_WORDS.has(cleaned)) return false;
  return /^[A-Z0-9]+$/.test(cleaned);
}

function looksLikeMonsterNameInline(candidate: string, minWords = 1): boolean {
  const words = candidate.trim().split(/\s+/).filter(Boolean);
  if (words.length < minWords || words.length > 4) return false;
  return words.every((word) => isUppercaseNameToken(word));
}

function normalizeEmbeddedMonsterNames(input: string): string {
  let text = input;

  // Case 1:
  // Sentence-ending punctuation followed by NAME then description.
  //
  // "... direction. DUNEFIEND Demons that appear ..."
  // => "... direction.\nDUNEFIEND\nDemons that appear ..."
  text = text.replace(
    /([.!?])\s+([A-Z][A-Z0-9,'’\-]*(?:\s+[A-Z][A-Z0-9,'’\-]*){0,3})\s+([A-Z][a-z][^\r\n]*)/g,
    (match, punct, maybeName, descriptionStart) => {
      if (!looksLikeMonsterNameInline(maybeName, 1)) {
        return match;
      }

      return `${punct}\n${maybeName}\n${descriptionStart}`;
    }
  );

  // Case 2:
  // Mid-sentence embedded MULTI-WORD name with a short lowercase tail.
  //
  // "... immune 1 day CANYON APE if pass)."
  // => "... immune 1 day if pass).\nCANYON APE"
  //
  // This requires 2+ uppercase words so we do not accidentally rip out
  // DEX / CHA / CON / etc.
  text = text.replace(
    /([a-z0-9)\]])\s+([A-Z][A-Z0-9,'’\-]*(?:\s+[A-Z][A-Z0-9,'’\-]+){1,3})\s+([a-z][^.\r\n]{0,30}[.)]?)/g,
    (match, prefixEnd, maybeName, suffix) => {
      if (!looksLikeMonsterNameInline(maybeName, 2)) {
        return match;
      }

      return `${prefixEnd} ${suffix}\n${maybeName}`;
    }
  );

  // Case 3:
  // Trailing name at the end of a block.
  //
  // "... wooden stake while at 0 HP. SNAKE, COBRA"
  // => "... wooden stake while at 0 HP.\nSNAKE, COBRA"
  text = text.replace(
    /([.!?])\s+([A-Z][A-Z0-9,'’\-]*(?:\s+[A-Z][A-Z0-9,'’\-]*){0,3})$/gm,
    (match, punct, maybeName) => {
      if (!looksLikeMonsterNameInline(maybeName, 1)) {
        return match;
      }

      return `${punct}\n${maybeName}`;
    }
  );

  return text;
}

export function splitRawShadowdarkBlocks(input: string): string[] {
  const normalizedInput = normalizeEmbeddedMonsterNames(input);

  const lines = normalizedInput
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: string[] = [];
  let currentBlock: string[] = [];

  const hasStatAnchor = (text: string): boolean =>
    /\bAC\b/i.test(text) &&
    /\bHP\b/i.test(text) &&
    /\bATK\b/i.test(text) &&
    /\bLV\b/i.test(text);

  const isLikelyMonsterName = (line: string): boolean => {
    if (line.length < 3 || line.length > 40) return false;
    return looksLikeMonsterNameInline(line, 1);
  };

  const isAbilityLead = (line: string): boolean => {
    return /^[A-Z][A-Za-z0-9'’\- ]{0,40}\./.test(line);
  };

  const isDescriptionLike = (line: string): boolean => {
    if (isLikelyMonsterName(line)) return false;
    if (isAbilityLead(line)) return false;
    if (/\bAC\b|\bHP\b|\bATK\b|\bAL\b|\bLV\b|\bMV\b/.test(line)) return false;
    return /^[A-Z]/.test(line) && /[a-z]/.test(line);
  };

  const upcomingHasStatAnchor = (startIndex: number, lookahead = 6): boolean => {
    const text = lines.slice(startIndex, startIndex + lookahead).join(" ");
    return hasStatAnchor(text);
  };

  const blockStartsWithName = (block: string[]): boolean => {
    if (block.length === 0) return false;
    return isLikelyMonsterName(block[0]);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (currentBlock.length === 0) {
      currentBlock.push(line);
      continue;
    }

    const currentText = currentBlock.join(" ");
    const currentHasStat = hasStatAnchor(currentText);
    const currentStartedWithName = blockStartsWithName(currentBlock);

    const shouldStartNewByLeadingName =
      currentHasStat &&
      currentStartedWithName &&
      isLikelyMonsterName(line);

    const shouldStartNewByDescription =
      currentHasStat &&
      isDescriptionLike(line) &&
      upcomingHasStatAnchor(i, 6);

    if (shouldStartNewByLeadingName || shouldStartNewByDescription) {
      blocks.push(currentBlock.join("\n"));
      currentBlock = [line];
      continue;
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks;
}