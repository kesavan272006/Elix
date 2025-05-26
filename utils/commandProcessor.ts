interface Command {
  type: 'reminder' | 'message' | 'task' | 'unknown';
  action: string;
  parameters: Record<string, any>;
}

class CommandProcessor {
  private async processWithAI(text: string): Promise<Command> {
    // TODO: Implement actual AI processing
    // For now, we'll use a simple keyword-based approach
    const lowerText = text.toLowerCase();

    if (lowerText.includes('remind') || lowerText.includes('reminder')) {
      return {
        type: 'reminder',
        action: 'create_reminder',
        parameters: {
          text: text,
          time: this.extractTime(text),
        },
      };
    }

    if (lowerText.includes('message') || lowerText.includes('text')) {
      return {
        type: 'message',
        action: 'send_message',
        parameters: {
          text: text,
          recipient: this.extractRecipient(text),
        },
      };
    }

    return {
      type: 'unknown',
      action: 'unknown',
      parameters: {},
    };
  }

  private extractTime(text: string): string | null {
    // Simple time extraction - can be enhanced with NLP
    const timeRegex = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;
    const match = text.match(timeRegex);
    return match ? match[0] : null;
  }

  private extractRecipient(text: string): string | null {
    // Simple recipient extraction - can be enhanced with NLP
    const afterMessage = text.split(/message|text/i)[1];
    if (!afterMessage) return null;
    
    const words = afterMessage.trim().split(' ');
    return words[0] || null;
  }

  async processCommand(text: string): Promise<Command> {
    try {
      const command = await this.processWithAI(text);
      return command;
    } catch (error) {
      console.error('Error processing command:', error);
      return {
        type: 'unknown',
        action: 'unknown',
        parameters: {},
      };
    }
  }
}

export const commandProcessor = new CommandProcessor(); 