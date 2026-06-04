import { EventEmitter } from "events";
import type { AgentEvent } from "@agent-shield/shared-types";

const RING_BUFFER_SIZE = 1000;

export class SecurityEventEmitter extends EventEmitter {
  private buffer: AgentEvent[] = [];

  emit(event: string, ...args: unknown[]): boolean;
  emit(eventType: "agent_event", event: AgentEvent): boolean;
  emit(eventOrType: string, ...args: unknown[]): boolean {
    if (eventOrType === "agent_event") {
      const event = args[0] as AgentEvent;
      this.buffer.push(event);
      if (this.buffer.length > RING_BUFFER_SIZE) {
        this.buffer.shift();
      }
    }
    return super.emit(eventOrType, ...args);
  }

  publishEvent(event: AgentEvent): void {
    this.emit("agent_event", event);
  }

  getBufferedEvents(executionId?: string): AgentEvent[] {
    if (!executionId) return [...this.buffer];
    return this.buffer.filter((e) => e.executionId === executionId);
  }

  clearBuffer(): void {
    this.buffer = [];
  }
}
