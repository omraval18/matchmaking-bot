import type { WhatsAppMessage } from "../../types/whatsapp.types.js";
import type { ConversationState } from "../../types/conversation.types.js";
import { WhatsAppService } from "../../services/whatsapp.service.js";
import { ConversationService } from "../../services/conversation.service.js";
import { UserService } from "../../services/user.service.js";
import { BiodataService } from "../../services/biodata.service.js";
import { ValidationUtils } from "../../utils/validation.utils.js";

export class CreateUserFlow {
  static async initialize(adminPhone: string): Promise<void> {
    await ConversationService.startFlow(adminPhone, "CREATE_USER");

    await WhatsAppService.sendTextMessage(
      adminPhone,
      "Please provide the WhatsApp number of the new user you want to add (include country code, e.g., 917779088399)",
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

    const validatedPhone = await ValidationUtils.validatePhoneOrNotify(
      adminPhone,
      message.text.body,
    );
    if (!validatedPhone) return;

    const userExists = await UserService.userExists(validatedPhone);

    if (userExists) {
      await WhatsAppService.sendTextMessage(
        adminPhone,
        `A user with phone number ${validatedPhone} already exists. Please provide a different number.`,
      );
      return;
    }

    const userId = await UserService.createUser(validatedPhone, false);

    console.log("Created new user:", { userId, phone: validatedPhone });

    await ConversationService.updateStep(adminPhone, "AWAITING_PDF", {
      newUserPhone: validatedPhone,
      newUserId: userId,
    });

    await WhatsAppService.sendTextMessage(
      adminPhone,
      `User created successfully! Please upload the biodata PDF for user ${validatedPhone}.`,
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

    const newUserPhone = data.newUserPhone as string;
    const newUserId = data.newUserId as number;

    try {
      console.log("Downloading PDF with media ID:", mediaId);
      const pdfBuffer = await WhatsAppService.downloadMedia(mediaId);

      console.log("Extracting biodata from PDF...");
      await WhatsAppService.sendTextMessage(
        adminPhone,
        "Processing your biodata PDF...",
      );

      const extractedData = await BiodataService.extractFromPdf(pdfBuffer);

      console.log("Extracted biodata:", extractedData);

      const biodataExists = await BiodataService.biodataExists(newUserId);

      if (biodataExists) {
        console.log("Biodata already exists for this user, skipping insert");

        await WhatsAppService.sendTextMessage(
          adminPhone,
          `✅ User creation completed! Biodata for ${extractedData.firstName} ${extractedData.lastName} was already saved.`,
        );
      } else {
        await BiodataService.createBiodata(newUserId, extractedData);

        console.log("Biodata saved to database successfully");

        await WhatsAppService.sendTextMessage(
          adminPhone,
          `✅ User creation completed! We have saved ${extractedData.firstName} ${extractedData.lastName}'s biodata.`,
        );
      }

      try {
        const welcomeMessage = `🎉 Welcome to our Matchmaking Service!

We're delighted to have you here. Your account has been successfully created, and we've received your biodata.

Our team will carefully review your profile and start finding compatible matches for you. We're committed to helping you find your perfect life partner.

You'll receive updates and match suggestions soon. Feel free to reach out if you have any questions.

Best wishes on your journey! 💫`;

        await WhatsAppService.sendTextMessage(newUserPhone, welcomeMessage);

        await WhatsAppService.sendTemplateMessage(
          newUserPhone,
          "matchmaking_user",
        );

        console.log("Welcome messages sent to new user successfully");
      } catch (error) {
        console.log("Could not send welcome messages to new user:", error);
      }

      await ConversationService.clearState(adminPhone);
    } catch (error) {
      await this.handleError(adminPhone, error);
    }
  }

  private static async handleError(
    adminPhone: string,
    error: unknown,
  ): Promise<void> {
    console.error("Error processing biodata PDF:", error);

    const isDuplicateError =
      error instanceof Error &&
      (error.message.includes("duplicate key") ||
        error.message.includes("unique constraint"));

    if (isDuplicateError) {
      console.log(
        "Duplicate biodata entry detected, but data was already saved successfully",
      );
      await ConversationService.clearState(adminPhone);
      return;
    }

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
          "Failed to save biodata to database. Please try uploading the file again.";
      }
    }

    await WhatsAppService.sendTextMessage(adminPhone, errorMessage);
  }
}
