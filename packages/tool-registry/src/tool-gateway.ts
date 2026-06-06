import type {
  SecureTool,
  SecurityContext,
  ToolCall,
  AgentEvent,
} from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { PolicyEvaluator } from "@agent-shield/policy-engine";
import type { SecurityEventEmitter } from "@agent-shield/security-runtime";
import { ToolExecutor } from "./tool-executor";
import {
  FETCH_WEB_CONTENT,
  SEND_MESSAGE,
  SECRET_READ_FILE,
  KNOWLEDGE_SEARCH,
} from "./tools/generic-tools";
import { v4 as uuidv4 } from "uuid";

export type ToolCallStatus = "approved" | "blocked" | "failed";

export interface ToolGatewayResult {
  status: ToolCallStatus;
  result?: unknown;
  reason?: string;
  toolCall: ToolCall;
}

export class ToolGateway {
  private executor: ToolExecutor;

  constructor(
    private ifcEngine: IFCEngine,
    private policyEvaluator: PolicyEvaluator,
    private eventEmitter: SecurityEventEmitter,
    executor?: ToolExecutor,
  ) {
    this.executor = executor ?? new ToolExecutor();
  }

  async execute(
    tool: SecureTool,
    params: Record<string, unknown>,
    context: SecurityContext,
  ): Promise<ToolGatewayResult> {
    const toolCallId = uuidv4();
    const taintChain = this.ifcEngine.tracker.getTaintChain(context.message.id);

    const pendingCall: ToolCall = {
      id: toolCallId,
      executionId: context.executionId,
      toolId: tool.id,
      toolName: tool.name,
      parameters: params,
      trustLevel: context.message.trustLevel,
      taintedBy: taintChain,
      status: "pending",
      timestamp: Date.now(),
    };

    this.eventEmitter.publishEvent({
      type: "tool_call_attempted",
      executionId: context.executionId,
      payload: { toolCall: pendingCall },
      timestamp: Date.now(),
    });

    // IFC check
    const contextWithTaint = { ...context, taintChain };
    const ifcResult = this.ifcEngine.checkToolExecution(tool, contextWithTaint);
    if (!ifcResult.allowed) {
      return this.blockCall(pendingCall, ifcResult.reason, context, taintChain);
    }

    // Policy check
    const policyResult = this.policyEvaluator.evaluate(contextWithTaint);
    if (policyResult.decision !== "allow") {
      return this.blockCall(pendingCall, policyResult.reason, context, taintChain, policyResult);
    }

    // Execute
    const approvedCall: ToolCall = { ...pendingCall, status: "approved" };
    this.eventEmitter.publishEvent({
      type: "tool_call_approved",
      executionId: context.executionId,
      payload: { toolCall: approvedCall },
      timestamp: Date.now(),
    });

    try {
      const result = await this.runTool(tool, params);
      return { status: "approved", result, toolCall: { ...approvedCall, status: "executed", result } };
    } catch (err) {
      const failed: ToolCall = { ...approvedCall, status: "failed" };
      return { status: "failed", reason: String(err), toolCall: failed };
    }
  }

  private blockCall(
    pendingCall: ToolCall,
    reason: string,
    context: SecurityContext,
    taintChain: string[],
    policyResult?: import("@agent-shield/shared-types").PolicyResult,
  ): ToolGatewayResult {
    const blockedCall: ToolCall = { ...pendingCall, status: "blocked", blockedReason: reason };

    this.eventEmitter.publishEvent({
      type: "tool_call_blocked",
      executionId: context.executionId,
      payload: {
        toolCall: blockedCall,
        policyResult: policyResult ?? {
          decision: "deny",
          reason,
          policyId: "ifc-engine",
          timestamp: Date.now(),
        },
        taintChain,
      },
      timestamp: Date.now(),
    });

    this.eventEmitter.publishEvent({
      type: "violation_detected",
      executionId: context.executionId,
      payload: {
        violation: {
          id: uuidv4(),
          executionId: context.executionId,
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

    return { status: "blocked", reason, toolCall: blockedCall };
  }

  private async runTool(tool: SecureTool, params: Record<string, unknown>): Promise<unknown> {
    switch (tool.id) {
      case FETCH_WEB_CONTENT.id:
        return this.executor.fetchWebContent(params.url as string);
      case SEND_MESSAGE.id:
        return this.executor.sendMessage(params.recipient as string, params.body as string);
      case SECRET_READ_FILE.id:
        return this.executor.readSecretFile(params.path as string);
      case KNOWLEDGE_SEARCH.id:
        return this.executor.searchKnowledgeBase(params.query as string);
      default:
        throw new Error(`Unknown tool: ${tool.id}`);
    }
  }

  getExecutor(): ToolExecutor {
    return this.executor;
  }
}
