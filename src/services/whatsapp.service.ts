import { env } from "../env.js";

const ACCESS_TOKEN = env.WA_ACCESS_TOKEN;
const PHONE_NUMBER_ID = env.WA_PHONE_NUMBER_ID;

export class WhatsAppService {
  private static readonly BASE_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}`;

  static async sendTextMessage(to: string, text: string): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }
  }

  static async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en",
  ): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }
  }

  static async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
  ): Promise<void> {
    const response = await fetch(`${this.BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: bodyText,
          },
          action: {
            buttons: buttons.map((btn) => ({
              type: "reply",
              reply: {
                id: btn.id,
                title: btn.title,
              },
            })),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WhatsApp API error: ${error}`);
    }
  }

  static async downloadMedia(mediaId: string): Promise<Buffer> {
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      },
    );

    if (!mediaInfoResponse.ok) {
      const error = await mediaInfoResponse.text();
      throw new Error(`Failed to get media info: ${error}`);
    }

    const mediaInfo = (await mediaInfoResponse.json()) as { url: string };

    const mediaResponse = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!mediaResponse.ok) {
      const error = await mediaResponse.text();
      throw new Error(`Failed to download media: ${error}`);
    }

    const arrayBuffer = await mediaResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
