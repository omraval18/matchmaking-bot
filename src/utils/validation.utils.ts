import { WhatsAppService } from "../services/whatsapp.service.js";

export class ValidationUtils {
  static validatePhoneNumber(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length >= 10 && cleaned.length <= 15) {
      return cleaned;
    }

    return null;
  }

  static async validatePhoneOrNotify(
    adminPhone: string,
    inputText: string
  ): Promise<string | null> {
    const validatedPhone = this.validatePhoneNumber(inputText);

    if (!validatedPhone) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Please enter a valid phone number with country code (e.g., 917779088399)"
      );
      return null;
    }

    return validatedPhone;
  }

  static isPdfDocument(mimeType: string): boolean {
    return mimeType === "application/pdf";
  }
}
