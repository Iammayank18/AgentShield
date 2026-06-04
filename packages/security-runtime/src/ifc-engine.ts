import type {
  SecureMessage,
  SecureTool,
  SecurityContext,
  ExecutionStep,
  AgentEvent,
} from "@agent-shield/shared-types";
import { TaintTracker } from "./taint-tracker";
import { SecurityEventEmitter } from "./security-event-emitter";

export interface IFCCheckResult {
  allowed: boolean;
  reason: string;
}

export class IFCEngine {
  private taintTracker: TaintTracker;
  private eventEmitter: SecurityEventEmitter;

  constructor(taintTracker: TaintTracker, eventEmitter: SecurityEventEmitter) {
    this.taintTracker = taintTracker;
    this.eventEmitter = eventEmitter;
  }

  processIncomingMessage(
    id: string,
    content: string,
    source: string,
    parents?: SecureMessage[],
  ): SecureMessage {
    const message = this.taintTracker.labelMessage(id, content, source);
    if (parents && parents.length > 0) {
      return this.taintTracker.propagateTaint(message, parents);
    }
    return message;
  }

  checkToolExecution(tool: SecureTool, context: SecurityContext): IFCCheckResult {
    // Non-privileged tools are always allowed at the IFC layer
    if (!tool.privileged) {
      return { allowed: true, reason: "Tool is not privileged" };
    }

    // Privileged tool: block if context is tainted
    if (this.taintTracker.isTainted(context.message.id)) {
      return {
        allowed: false,
        reason: `Privileged tool '${tool.name}' cannot execute: context message '${context.message.id}' is tainted by untrusted sources`,
      };
    }

    // Check trust level directly
    if (context.message.trustLevel === "untrusted") {
      return {
        allowed: false,
        reason: `Privileged tool '${tool.name}' cannot execute from untrusted context`,
      };
    }

    // Check allowedTrustLevels
    if (!tool.allowedTrustLevels.includes(context.message.trustLevel)) {
      return {
        allowed: false,
        reason: `Tool '${tool.name}' does not allow trust level '${context.message.trustLevel}'`,
      };
    }

    return { allowed: true, reason: "IFC check passed" };
  }

  recordStep(step: ExecutionStep): void {
    const event: AgentEvent = {
      type: "step_added",
      executionId: step.executionId,
      payload: { step },
      timestamp: Date.now(),
    };
    this.eventEmitter.publishEvent(event);
  }

  get emitter(): SecurityEventEmitter {
    return this.eventEmitter;
  }

  get tracker(): TaintTracker {
    return this.taintTracker;
  }
}
