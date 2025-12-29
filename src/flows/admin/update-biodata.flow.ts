import type { WhatsAppMessage } from "../../types/whatsapp.types.js";
import type { ConversationState } from "../../types/conversation.types.js";
import { WhatsAppService } from "../../services/whatsapp.service.js";
import { ConversationService } from "../../services/conversation.service.js";
import { UserService } from "../../services/user.service.js";
import { BiodataService } from "../../services/biodata.service.js";
import { ValidationUtils } from "../../utils/validation.utils.js";

export class UpdateBiodataFlow {
  static async initialize(adminPhone: string): Promise<void> {
    await ConversationService.startFlow(adminPhone, "UPDATE_BIO");

    await WhatsAppService.sendTextMessage(
      adminPhone,
      "Please provide the WhatsApp number of the user whose biodata you want to update (include country code, e.g., 917779088399)",
    );

    await ConversationService.updateStep(adminPhone, "AWAITING_PHONE");
  }

  static async handle(
    state: ConversationState,
    message: WhatsAppMessage,
  ): Promise<void> {
    const { phone: adminPhone, step, data } = state;

    if (step === "AWAITING_PHONE") {
      await this.handlePhoneInput(adminPhone, message);
    } else if (step === "AWAITING_PDF") {
      await this.handlePdfUpload(adminPhone, data, message);
    }
  }

  private static async handlePhoneInput(
    adminPhone: string,
    message: WhatsAppMessage,
  ): Promise<void> {
    if (message.type !== "text" || !message.text?.body) {
      return;
    }

    const validatedPhone = ValidationUtils.validatePhoneNumber(
      message.text.body,
    );

    if (!validatedPhone) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Please enter a valid phone number with country code (e.g., 917779088399)",
      );
      return;
    }

    // Check if user exists
    const user = await UserService.getUserByPhone(validatedPhone);

    if (!user) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        `❌ User with phone number ${validatedPhone} does not exist in the database. Please provide a valid phone number that exists.`,
      );
      return;
    }

    // User exists, ask for PDF
    await ConversationService.updateStep(adminPhone, "AWAITING_PDF", {
      targetUserPhone: validatedPhone,
      targetUserId: user.id,
    });

    await WhatsAppService.sendTextMessage(
      adminPhone,
      `User found! Please upload the updated biodata PDF for user ${validatedPhone}.`,
    );
  }

  private static async handlePdfUpload(
    adminPhone: string,
    data: Record<string, unknown>,
    message: WhatsAppMessage,
  ): Promise<void> {
    if (message.type !== "document" || !message.document) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Please upload the biodata as a PDF document.",
      );
      return;
    }

    const { mime_type: mimeType, id: mediaId } = message.document;

    if (!ValidationUtils.isPdfDocument(mimeType)) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Please upload a PDF file only. Other formats are not supported.",
      );
      return;
    }

    const targetUserPhone = data.targetUserPhone as string;
    const targetUserId = data.targetUserId as number;

    try {
      console.log("Downloading updated biodata PDF with media ID:", mediaId);
      const pdfBuffer = await WhatsAppService.downloadMedia(mediaId);

      console.log("Extracting biodata from PDF...");
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Processing your biodata PDF...",
      );

      const extractedData = await BiodataService.extractFromPdf(pdfBuffer);

      console.log("Extracted biodata:", extractedData);

      // Update existing biodata in database
      await BiodataService.updateBiodata(targetUserId, extractedData);

      console.log("Biodata updated in database successfully");

      // Send confirmation to admin
      await WhatsAppService.sendTextMessage(
        adminPhone,
        `✅ Biodata updated successfully! We have saved ${extractedData.firstName} ${extractedData.lastName}'s updated biodata.`,
      );

      // Try to send notification to the user whose bio was updated
      try {
        await WhatsAppService.sendTextMessage(
          targetUserPhone,
          "Your biodata has been updated successfully. Our team will review it and get back to you soon.",
        );
      } catch (error) {
        console.log("Could not send notification to user:", error);
      }

      // Clear conversation state
      await ConversationService.clearState(adminPhone);
    } catch (error) {
      await this.handleError(adminPhone, error);
    }
  }

  private static async handleError(
    adminPhone: string,
    error: unknown,
  ): Promise<void> {
    console.error("Error processing updated biodata PDF:", error);

    // Provide specific error message based on error type
    let errorMessage =
      "Failed to process the biodata PDF. Please upload the file again.";

    if (error instanceof Error) {
      if (error.message.includes("extract")) {
        errorMessage =
          "Could not extract information from the PDF. Please ensure the biodata is clearly written and try uploading again.";
      } else if (error.message.includes("download")) {
        errorMessage =
          "Failed to download the PDF from WhatsApp. Please try uploading again.";
      } else if (error.message.includes("database")) {
        errorMessage =
          "Failed to update biodata in database. Please try uploading the file again.";
      }
    }

    await WhatsAppService.sendTextMessage(adminPhone, errorMessage);

    // Stay in AWAITING_PDF step - user can try uploading again
  }
}
