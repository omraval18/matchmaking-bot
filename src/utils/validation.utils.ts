export class ValidationUtils {
  static validatePhoneNumber(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }

    return null;
  }

  static isPdfDocument(mimeType: string): boolean {
    return mimeType === "application/pdf";
  }
}
