declare module '@ai-sdk/svelte' {
  export interface ChatMessagePart {
    type: string;
    text?: string;
  }

  export interface ChatMessage {
    role: string;
    parts: ChatMessagePart[];
  }

  export type ChatStatus = 'idle' | 'submitted' | 'streaming' | 'error' | string;

  export class Chat {
    messages: ChatMessage[];
    status: ChatStatus;
    error?: unknown;
    constructor(opts?: any);
    sendMessage(message: { text: string } | any): Promise<void>;
  }

  const _default: typeof Chat;
  export default _default;
}
