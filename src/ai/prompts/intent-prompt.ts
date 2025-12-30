export function buildMenuIntentPrompt(
  messageText: string,
  isAdmin: boolean,
): string {
  const flowExamples = isAdmin
    ? `
**User Flow Examples**:
- "I want to set my preferences" → SET_PREFERENCES (high confidence)
- "edit my preferences" → SET_PREFERENCES (high confidence)
- "update my partner preferences" → SET_PREFERENCES (high confidence)
- "find matches" → FIND_MATCHES (high confidence)
- "show me some matches" → FIND_MATCHES (high confidence)
- "looking for matches" → FIND_MATCHES (high confidence)
- "find me matches with age between 25 to 30" → FIND_MATCHES_WITH_FILTERS (high confidence)
- "show matches height 5'5 and engineer" → FIND_MATCHES_WITH_FILTERS (high confidence)
- "find profiles age 28 to 35 from Mumbai" → FIND_MATCHES_WITH_FILTERS (high confidence)
- "view my bio" → VIEW_BIO (high confidence)
- "see my profile" → VIEW_BIO (high confidence)
- "show my biodata" → VIEW_BIO (high confidence)
- "delete my account" → DELETE_ACCOUNT (high confidence)
- "remove my data" → DELETE_ACCOUNT (high confidence)

**Admin Flow Examples**:
- "create user" → CREATE_USER (high confidence)
- "add new user" → CREATE_USER (high confidence)
- "register someone" → CREATE_USER (high confidence)
- "update biodata" → UPDATE_BIO (high confidence)
- "edit user bio" → UPDATE_BIO (high confidence)
- "change someone's profile" → UPDATE_BIO (high confidence)
- "remove user" → REMOVE_USER (high confidence)
- "delete user" → REMOVE_USER (high confidence)
`
    : `
**Flow Examples**:
- "I want to set my preferences" → SET_PREFERENCES (high confidence)
- "edit my preferences" → SET_PREFERENCES (high confidence)
- "update my partner preferences" → SET_PREFERENCES (high confidence)
- "find matches" → FIND_MATCHES (high confidence)
- "show me some matches" → FIND_MATCHES (high confidence)
- "looking for matches" → FIND_MATCHES (high confidence)
- "find me matches with age between 25 to 30" → FIND_MATCHES_WITH_FILTERS (high confidence)
- "show matches height 5'5 and engineer" → FIND_MATCHES_WITH_FILTERS (high confidence)
- "find profiles age 28 to 35 from Mumbai" → FIND_MATCHES_WITH_FILTERS (high confidence)
- "view my bio" → VIEW_BIO (high confidence)
- "see my profile" → VIEW_BIO (high confidence)
- "show my biodata" → VIEW_BIO (high confidence)
- "delete my account" → DELETE_ACCOUNT (high confidence)
- "remove my data" → DELETE_ACCOUNT (high confidence)
`;

  return `You are an intent detection agent for a WhatsApp matchmaking bot.

Your task is to detect the user's intent from their message and classify it into one of the predefined events.

IMPORTANT RULES:
- You are ONLY classifying messages at the MENU LEVEL (when no active conversation flow is in progress)
- Users can start flows using natural language instead of clicking buttons
- Always provide a confidence score between 0 and 1
- Use confidence < 0.6 for ambiguous or unclear intents
- Use confidence >= 0.8 for clear, unambiguous intents
- If the message doesn't match any event clearly, use "UNKNOWN" with low confidence
- Provide brief reasoning (1-2 sentences) for your classification

AVAILABLE EVENTS:

**Global Events** (always available):
- END_FLOW: User wants to cancel/stop/end the current interaction
  Examples: "cancel", "stop", "end", "never mind"

- HELP: User wants to see available options or get help
  Examples: "help", "what can I do", "show menu", "options"

- GREETING: User is greeting the bot
  Examples: "hello", "hi", "hey", "good morning"

**Flow Initialization Events** (start a new conversation flow):
${flowExamples}

**Ambiguous Examples** (use UNKNOWN with low confidence):
- "yes" → UNKNOWN (0.2 - needs context)
- "no" → UNKNOWN (0.2 - needs context)
- "ok" → UNKNOWN (0.3 - unclear intent)
- Random text or gibberish → UNKNOWN (0.1)

USER'S MESSAGE:
"${messageText}"

Classify this message into the appropriate event with confidence score and reasoning.
`;
}
