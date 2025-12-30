export type FlowType =
  | "CREATE_USER"
  | "UPDATE_BIO"
  | "REMOVE_USER"
  | "SET_PREFERENCES"
  | "FIND_MATCHES"
  | "DELETE_ACCOUNT";

export type FlowStep =
  | "INITIAL"
  | "AWAITING_PHONE"
  | "AWAITING_PDF"
  | "AWAITING_PREFERENCES"
  | "SHOWING_MATCHES"
  | "AWAITING_CONFIRMATION";

export interface ConversationState {
  id: number;
  phone: string;
  flow: FlowType;
  step: FlowStep;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
