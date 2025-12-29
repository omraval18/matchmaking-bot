export class MessageDeduplication {
  private static processedMessageIds = new Set<string>();
  private static readonly MAX_CACHE_SIZE = 1000;

  static isProcessed(messageId: string): boolean {
    return this.processedMessageIds.has(messageId);
  }

  static markAsProcessed(messageId: string): void {
    this.processedMessageIds.add(messageId);

    if (this.processedMessageIds.size > this.MAX_CACHE_SIZE) {
      const firstId = this.processedMessageIds.values().next().value;
      if (firstId) {
        this.processedMessageIds.delete(firstId);
      }
    }
  }
}
