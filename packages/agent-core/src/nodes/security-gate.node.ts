import type { AgentState } from "../agent/state";
import type { ExecutionStep } from "@agent-shield/shared-types";
import type { IFCEngine, SecurityEventEmitter } from "@agent-shield/security-runtime";
import type { PolicyEvaluator } from "@agent-shield/policy-engine";
import { SEND_MESSAGE, SECRET_READ_FILE } from "@agent-shield/tool-registry";
import { v4 as uuidv4 } from "uuid";

export function createSecurityGateNode(
  ifcEngine: IFCEngine,
  policyEvaluator: PolicyEvaluator,
  eventEmitter?: SecurityEventEmitter,
) {
  return async function securityGateNode(state: AgentState): Promise<Partial<AgentState>> {
    const planMessage = state.planMessage!;
    const taintChain = ifcEngine.tracker.getTaintChain(planMessage.id);

    // Determine which privileged tool the plan intends to call
    const planContent = planMessage.content;
    const isAttack = state.useAttackScenario || planContent.includes("[SYSTEM OVERRIDE DETECTED IN CONTEXT]");
    const intendedTool = isAttack ? SECRET_READ_FILE : SEND_MESSAGE;

    const step: ExecutionStep = {
      id: uuidv4(),
      executionId: state.executionId,
      type: "security_check",
      label: `Security Gate: Evaluating '${intendedTool.name}'`,
      trustLevel: planMessage.trustLevel,
      taintedBy: taintChain,
      content: state.shieldEnabled
        ? `AgentShield IFC + Policy check for tool: ${intendedTool.name}`
        : `Shield DISABLED — skipping security checks for tool: ${intendedTool.name}`,
      timestamp: Date.now(),
      metadata: {
        shieldEnabled: state.shieldEnabled,
        taintChainLength: taintChain.length,
        toolId: intendedTool.id,
      },
    };

    ifcEngine.recordStep(step);

    if (!state.shieldEnabled) {
      // Unprotected mode — let everything through
      return { steps: [...state.steps, step] };
    }

    // Protected mode — run IFC + policy
    const context = {
      message: planMessage,
      tool: intendedTool,
      taintChain,
      executionId: state.executionId,
    };

    const ifcResult = ifcEngine.checkToolExecution(intendedTool, context);
    if (!ifcResult.allowed) {
      const blockedStep: ExecutionStep = {
        id: uuidv4(),
        executionId: state.executionId,
        type: "security_check",
        label: `BLOCKED by AgentShield IFC`,
        trustLevel: planMessage.trustLevel,
        taintedBy: taintChain,
        content: ifcResult.reason,
        timestamp: Date.now(),
        metadata: { blocked: true, layer: "ifc" },
      };
      ifcEngine.recordStep(blockedStep);
      emitBlockedEvents(eventEmitter, state.executionId, intendedTool.name, ifcResult.reason, taintChain, "ifc-engine");
      return {
        isBlocked: true,
        blockedReason: ifcResult.reason,
        steps: [...state.steps, step, blockedStep],
      };
    }

    const policyResult = policyEvaluator.evaluate(context);
    if (policyResult.decision !== "allow") {
      const blockedStep: ExecutionStep = {
        id: uuidv4(),
        executionId: state.executionId,
        type: "security_check",
        label: `BLOCKED by Policy: ${policyResult.policyId}`,
        trustLevel: planMessage.trustLevel,
        taintedBy: taintChain,
        content: policyResult.reason,
        timestamp: Date.now(),
        metadata: { blocked: true, layer: "policy", policyId: policyResult.policyId },
      };
      ifcEngine.recordStep(blockedStep);
      emitBlockedEvents(eventEmitter, state.executionId, intendedTool.name, policyResult.reason, taintChain, policyResult.policyId);
      return {
        isBlocked: true,
        blockedReason: policyResult.reason,
        steps: [...state.steps, step, blockedStep],
      };
    }

    return { steps: [...state.steps, step] };
  };
}

export function securityRouter(state: AgentState): "allowed" | "blocked" {
  return state.isBlocked ? "blocked" : "allowed";
}

function emitBlockedEvents(
  eventEmitter: SecurityEventEmitter | undefined,
  executionId: string,
  toolName: string,
  reason: string,
  taintChain: string[],
  policyId: string,
) {
  if (!eventEmitter) return;
  const toolCallId = uuidv4();
  const blockedCall = {
    id: toolCallId,
    executionId,
    toolId: policyId,
    toolName,
    parameters: {},
    trustLevel: "untrusted" as const,
    taintedBy: taintChain,
    status: "blocked" as const,
    blockedReason: reason,
    timestamp: Date.now(),
  };
  eventEmitter.publishEvent({
    type: "tool_call_blocked",
    executionId,
    payload: { toolCall: blockedCall, taintChain },
    timestamp: Date.now(),
  });
  eventEmitter.publishEvent({
    type: "violation_detected",
    executionId,
    payload: {
      violation: {
        id: uuidv4(),
        executionId,
        type: taintChain.length > 0 ? "privilege_escalation" : "policy_violation",
        severity: "critical",
        description: reason,
        blockedToolCall: blockedCall,
        taintChain,
        timestamp: Date.now(),
      },
    },
    timestamp: Date.now(),
  });
}
