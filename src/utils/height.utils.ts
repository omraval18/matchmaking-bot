function feetInchesToCm(feet: number, inches: number = 0): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * 2.54);
}

export function parseHeightToCm(heightStr: string): number | null {
  if (!heightStr || typeof heightStr !== "string") {
    return null;
  }

  const trimmed = heightStr.trim().toLowerCase();

  const cmMatch = trimmed.match(/^(\d+\.?\d*)\s*cm?$/);
  if (cmMatch) {
    return Math.round(parseFloat(cmMatch[1]));
  }

  const justNumber = trimmed.match(/^(\d+\.?\d*)$/);
  if (justNumber) {
    const value = parseFloat(justNumber[1]);
    if (value > 50) {
      return Math.round(value);
    }
  }

  const feetInchesQuote = trimmed.match(/(\d+)'?\s*(\d+)?["']?/);
  if (feetInchesQuote) {
    const feet = parseInt(feetInchesQuote[1]);
    const inches = feetInchesQuote[2] ? parseInt(feetInchesQuote[2]) : 0;
    return feetInchesToCm(feet, inches);
  }

  const feetInchesWord = trimmed.match(
    /(\d+)\s*(?:ft|feet)\s*(\d+)?\s*(?:in|inch|inches)?/,
  );
  if (feetInchesWord) {
    const feet = parseInt(feetInchesWord[1]);
    const inches = feetInchesWord[2] ? parseInt(feetInchesWord[2]) : 0;
    return feetInchesToCm(feet, inches);
  }

  const decimalFeet = trimmed.match(/^(\d+)\.(\d+)$/);
  if (decimalFeet) {
    const feet = parseInt(decimalFeet[1]);
    const inches = parseInt(decimalFeet[2]);
    if (inches <= 11) {
      return feetInchesToCm(feet, inches);
    }
  }

  return null;
}
