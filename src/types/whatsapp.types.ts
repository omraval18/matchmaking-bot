export type WhatsAppMessageType =
  | "text"
  | "document"
  | "image"
  | "button"
  | "interactive";

export interface WhatsAppTextMessage {
  body: string;
}

export interface WhatsAppDocument {
  filename: string;
  mime_type: string;
  sha256: string;
  id: string;
}

export interface WhatsAppButton {
  payload: string;
  text: string;
}

export interface WhatsAppInteractiveButtonReply {
  id: string;
  title: string;
}

export interface WhatsAppInteractive {
  type: "button_reply" | "list_reply";
  button_reply?: WhatsAppInteractiveButtonReply;
  list_reply?: {
    id: string;
    title: string;
    description?: string;
  };
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text?: WhatsAppTextMessage;
  document?: WhatsAppDocument;
  button?: WhatsAppButton;
  interactive?: WhatsAppInteractive;
}

export interface WhatsAppWebhookValue {
  messages?: WhatsAppMessage[];
  metadata?: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: {
      name: string;
    };
    wa_id: string;
  }>;
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field: string;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}
