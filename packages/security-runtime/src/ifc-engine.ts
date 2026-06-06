import type {
  SecureMessage,
  SecureTool,
  SecurityContext,
  ExecutionStep,
  AgentEvent,
} from "@agent-shield/shared-types";
import { TaintTracker } from "./taint-tracker";
import { SecurityEventEmitter } from "./security-event-emitter";
import { AgentIdentityRegistry } from "./identity-registry";

export interface IFCCheckResult {
  allowed: boolean;
  reason: string;
}

export class IFCEngine {
  private taintTracker: TaintTracker;
  private eventEmitter: SecurityEventEmitter;
  private identityRegistry: AgentIdentityRegistry;

  constructor(
    taintTracker: TaintTracker,
    eventEmitter: SecurityEventEmitter,
    identityRegistry?: AgentIdentityRegistry,
  ) {
    this.taintTracker = taintTracker;
    this.eventEmitter = eventEmitter;
    this.identityRegistry = identityRegistry ?? new AgentIdentityRegistry();
  }

  processIncomingMessage(
    id: string,
    content: string,
    source: string,
    parents?: SecureMessage[],
    callerId?: string,
  ): SecureMessage {
    // Verify the caller is authorized to claim this source identity
    const verification = this.identityRegistry.verify(source, callerId);

    if (verification.spoofingDetected) {
      // Emit spoofing event before processing
      this.eventEmitter.publishEvent({
        type: "identity_spoofing_detected",
        executionId: id,
        payload: {
          claimedSource: source,
          callerId,
          reason: verification.reason,
          messageId: id,
        },
        timestamp: Date.now(),
      });
    }

    // If spoofing detected, override source to untrusted regardless of what was claimed
    const effectiveSource = verification.spoofingDetected ? "untrusted" : source;

    const message = this.taintTracker.labelMessage(id, content, effectiveSource);

    if (parents && parents.length > 0) {
      return this.taintTracker.propagateTaint(message, parents);
    }
    return message;
  }

  checkToolExecution(tool: SecureTool, context: SecurityContext): IFCCheckResult {
    if (!tool.privileged) {
      return { allowed: true, reason: "Tool is not privileged" };
    }

    if (this.taintTracker.isTainted(context.message.id)) {
      return {
        allowed: false,
        reason: `Privileged tool '${tool.name}' cannot execute: context message '${context.message.id}' is tainted by untrusted sources`,
      };
    }

    if (context.message.trustLevel === "untrusted") {
      return {
        allowed: false,
        reason: `Privileged tool '${tool.name}' cannot execute from untrusted context`,
      };
    }

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

  get registry(): AgentIdentityRegistry {
    return this.identityRegistry;
  }
}
