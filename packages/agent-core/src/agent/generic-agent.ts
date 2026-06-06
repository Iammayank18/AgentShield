import { StateGraph, END, START } from "@langchain/langgraph";
import type { AgentState } from "./state";
import type { IFCEngine, SecurityEventEmitter } from "@agent-shield/security-runtime";
import type { PolicyEvaluator } from "@agent-shield/policy-engine";
import type { ToolGateway } from "@agent-shield/tool-registry";
import { createInputProcessorNode } from "../nodes/input-processor.node";
import { createInputAnalyzerNode } from "../nodes/issue-retriever.node";
import { createPlannerNode } from "../nodes/planner.node";
import { createSecurityGateNode, securityRouter } from "../nodes/security-gate.node";
import { createToolExecutorNode } from "../nodes/tool-executor.node";
import { createResponderNode } from "../nodes/responder.node";

export interface AgentDependencies {
  ifcEngine: IFCEngine;
  policyEvaluator: PolicyEvaluator;
  toolGateway: ToolGateway;
  eventEmitter: SecurityEventEmitter;
  llm?: import("@langchain/core/language_models/chat_models").BaseChatModel;
}

export function buildGenericAgent(deps: AgentDependencies) {
  const { ifcEngine, policyEvaluator, toolGateway, eventEmitter, llm } = deps;

  const graph = new StateGraph<AgentState>({
    channels: {
      executionId: { value: (_: string, x: string) => x, default: () => "" },
      sessionId: { value: (_: string, x: string) => x, default: () => "" },
      input: { value: (_: string, x: string) => x, default: () => "" },
      shieldEnabled: { value: (_: boolean, x: boolean) => x, default: () => true },
      useAttackScenario: { value: (_: boolean, x: boolean) => x, default: () => false },
      messages: { value: (_: any, x: any) => x, default: () => [] },
      currentMessage: { value: (_: any, x: any) => x, default: () => null },
      issueMessage: { value: (_: any, x: any) => x, default: () => null },
      planMessage: { value: (_: any, x: any) => x, default: () => null },
      steps: { value: (_: any, x: any) => x, default: () => [] },
      toolCalls: { value: (_: any, x: any) => x, default: () => [] },
      violations: { value: (_: any, x: any) => x, default: () => [] },
      output: { value: (_: string, x: string) => x, default: () => "" },
      isBlocked: { value: (_: boolean, x: boolean) => x, default: () => false },
      blockedReason: { value: (_: string, x: string) => x, default: () => "" },
      error: { value: (_: any, x: any) => x, default: () => null },
    },
  });

  graph
    .addNode("input_processor", createInputProcessorNode(ifcEngine, eventEmitter))
    .addNode("input_analyzer", createInputAnalyzerNode(ifcEngine, toolGateway))
    .addNode("planner", createPlannerNode(ifcEngine, llm))
    .addNode("security_gate", createSecurityGateNode(ifcEngine, policyEvaluator, eventEmitter))
    .addNode("tool_executor", createToolExecutorNode(ifcEngine, toolGateway))
    .addNode("responder", createResponderNode(ifcEngine, eventEmitter));

  // `as any` works around a LangGraph type-inference limitation where chained
  // addEdge/addConditionalEdges calls lose their generic node-name types.
  (graph as any)
    .addEdge(START, "input_processor")
    .addEdge("input_processor", "input_analyzer")
    .addEdge("input_analyzer", "planner")
    .addEdge("planner", "security_gate")
    .addConditionalEdges("security_gate", securityRouter, {
      allowed: "tool_executor",
      blocked: "responder",
    })
    .addEdge("tool_executor", "responder")
    .addEdge("responder", END);

  return graph.compile();
}
