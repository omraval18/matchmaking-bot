import { WhatsAppService } from "../../services/whatsapp.service.js";
import { UserService } from "../../services/user.service.js";
import { db } from "../../lib/db/index.js";
import { bios } from "../../lib/db/schema.js";
import { eq } from "drizzle-orm";

export class ViewBioFlow {
  static async execute(userPhone: string): Promise<void> {
    try {
      // Get user
      const user = await UserService.getUserByPhone(userPhone);
      if (!user) {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "Error: User not found. Please contact support.",
        );
        return;
      }

      // Get biodata
      const userBio = await db
        .select()
        .from(bios)
        .where(eq(bios.userId, user.id))
        .limit(1);

      if (userBio.length === 0) {
        await WhatsAppService.sendTextMessage(
          userPhone,
          "❌ You don't have a biodata profile yet.\n\nPlease contact admin to create your profile.",
        );
        return;
      }

      const bio = userBio[0];

      // Format biodata
      let bioMessage = `📋 *Your Biodata Profile*\n\n`;

      bioMessage += `👤 *Personal Information*\n`;
      bioMessage += `   Name: ${bio.firstName} ${bio.lastName}\n`;
      bioMessage += `   Gender: ${bio.gender}\n`;
      bioMessage += `   Age: ${bio.age} years\n`;
      bioMessage += `   Date of Birth: ${bio.dateOfBirth}\n`;
      bioMessage += `   Height: ${bio.height}\n`;
      if (bio.diet) {
        bioMessage += `   Diet: ${bio.diet}\n`;
      }
      bioMessage += `\n`;

      bioMessage += `📍 *Location Details*\n`;
      bioMessage += `   Native City: ${bio.city}\n`;
      if (bio.currentCity) {
        bioMessage += `   Current City: ${bio.currentCity}\n`;
      }
      bioMessage += `   Citizenship: ${bio.citizenship}\n`;
      bioMessage += `\n`;

      bioMessage += `🎓 *Professional Information*\n`;
      bioMessage += `   Education: ${bio.education}\n`;
      bioMessage += `   Occupation: ${bio.occupation}\n`;
      if (bio.company) {
        bioMessage += `   Company: ${bio.company}\n`;
      }
      bioMessage += `\n`;

      bioMessage += `🏛️ *Community*\n`;
      bioMessage += `   Caste: ${bio.caste}\n`;
      bioMessage += `\n`;

      bioMessage += `💡 *To update your biodata, please contact the admin.*`;

      await WhatsAppService.sendTextMessage(userPhone, bioMessage);
    } catch (error) {
      console.error("Error viewing biodata:", error);
      await WhatsAppService.sendTextMessage(
        userPhone,
        "Sorry, there was an error retrieving your biodata. Please try again later.",
      );
    }
  }
}
