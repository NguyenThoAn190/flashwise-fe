/**
 * Multi-delimiter Bulk Flashcard Text Parser Engine
 * Supports Tab (\t), Comma (,), Semicolon (;), and Custom delimiters for both
 * term/definition pairs and card rows.
 */

export interface BulkParseCard {
  front_content: string;
  back_content: string;
}

export interface BulkParseError {
  line: number;
  message: string;
  content?: string;
}

export interface BulkParserResult {
  cards: BulkParseCard[];
  errors: BulkParseError[];
}

export type TermDelimiterOption = "tab" | "comma" | "semicolon" | "custom";
export type CardDelimiterOption = "newline" | "semicolon" | "custom";

export function resolveTermDelimiter(
  option: TermDelimiterOption,
  custom = "-"
): string {
  switch (option) {
    case "tab":
      return "\t";
    case "comma":
      return ",";
    case "semicolon":
      return ";";
    case "custom":
      return custom || "\t";
    default:
      return "\t";
  }
}

export function resolveCardDelimiter(
  option: CardDelimiterOption,
  custom = "\n\n"
): string {
  switch (option) {
    case "newline":
      return "\n";
    case "semicolon":
      return ";";
    case "custom":
      return custom || "\n";
    default:
      return "\n";
  }
}

/**
 * Parses raw text into validated flashcard pairs and per-line errors.
 * Gracefully ignores blank/whitespace-only lines.
 */
export function parseBulkText(
  rawText: string,
  termDelimiter: string = "\t",
  cardDelimiter: string = "\n"
): BulkParserResult {
  const cards: BulkParseCard[] = [];
  const errors: BulkParseError[] = [];

  if (!rawText || !rawText.trim()) {
    return { cards, errors };
  }

  const effectiveTermDelim = termDelimiter || "\t";
  const effectiveCardDelim = cardDelimiter || "\n";

  // Normalize CRLF if splitting by \n
  const normalizedText =
    effectiveCardDelim === "\n" ? rawText.replace(/\r\n/g, "\n") : rawText;

  const lines = normalizedText.split(effectiveCardDelim);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    if (!trimmed) {
      return;
    }

    const separatorIndex = line.indexOf(effectiveTermDelim);
    if (separatorIndex === -1) {
      errors.push({
        line: lineNumber,
        message: `Missing delimiter '${
          effectiveTermDelim === "\t" ? "\\t" : effectiveTermDelim
        }'`,
        content: line,
      });
      return;
    }

    const front = line.substring(0, separatorIndex).trim();
    const back = line
      .substring(separatorIndex + effectiveTermDelim.length)
      .trim();

    if (!front || !back) {
      errors.push({
        line: lineNumber,
        message: "Both term and definition must be non-empty",
        content: line,
      });
      return;
    }

    cards.push({
      front_content: front,
      back_content: back,
    });
  });

  return { cards, errors };
}
