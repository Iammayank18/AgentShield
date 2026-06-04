import { StateGraph, END, START } from "@langchain/langgraph";
import type { AgentState } from "./state";
import type { IFCEngine, SecurityEventEmitter } from "@agent-shield/security-runtime";
import type { PolicyEvaluator } from "@agent-shield/policy-engine";
import type { ToolGateway } from "@agent-shield/tool-registry";
import { createInputProcessorNode } from "../nodes/input-processor.node";
import { createIssueRetrieverNode } from "../nodes/issue-retriever.node";
import { createPlannerNode } from "../nodes/planner.node";
import { createSecurityGateNode, securityRouter } from "../nodes/security-gate.node";
import { createToolExecutorNode } from "../nodes/tool-executor.node";
import { createResponderNode } from "../nodes/responder.node";

export interface AgentDependencies {
  ifcEngine: IFCEngine;
  policyEvaluator: PolicyEvaluator;
  toolGateway: ToolGateway;
  eventEmitter: SecurityEventEmitter;
  llm?: import("@langchain/openai").AzureChatOpenAI;
}

export function buildGitHubSupportAgent(deps: AgentDependencies) {
  const { ifcEngine, policyEvaluator, toolGateway, eventEmitter, llm } = deps;

  const graph = new StateGraph<AgentState>({
    channels: {
      executionId: { value: (x: string) => x, default: () => "" },
      sessionId: { value: (x: string) => x, default: () => "" },
      input: { value: (x: string) => x, default: () => "" },
      shieldEnabled: { value: (x: boolean) => x, default: () => true },
      useAttackScenario: { value: (x: boolean) => x, default: () => false },
      messages: { value: (x: any) => x, default: () => [] },
      currentMessage: { value: (x: any) => x, default: () => null },
      issueMessage: { value: (x: any) => x, default: () => null },
      planMessage: { value: (x: any) => x, default: () => null },
      steps: { value: (x: any) => x, default: () => [] },
      toolCalls: { value: (x: any) => x, default: () => [] },
      violations: { value: (x: any) => x, default: () => [] },
      output: { value: (x: string) => x, default: () => "" },
      isBlocked: { value: (x: boolean) => x, default: () => false },
      blockedReason: { value: (x: string) => x, default: () => "" },
      error: { value: (x: any) => x, default: () => null },
    },
  });

  graph
    .addNode("input_processor", createInputProcessorNode(ifcEngine, eventEmitter))
    .addNode("issue_retriever", createIssueRetrieverNode(ifcEngine, toolGateway))
    .addNode("planner", createPlannerNode(ifcEngine, llm))
    .addNode("security_gate", createSecurityGateNode(ifcEngine, policyEvaluator))
    .addNode("tool_executor", createToolExecutorNode(ifcEngine, toolGateway))
    .addNode("responder", createResponderNode(ifcEngine, eventEmitter));

  graph
    .addEdge(START, "input_processor")
    .addEdge("input_processor", "issue_retriever")
    .addEdge("issue_retriever", "planner")
    .addEdge("planner", "security_gate")
    .addConditionalEdges("security_gate", securityRouter, {
      allowed: "tool_executor",
      blocked: "responder",
    })
    .addEdge("tool_executor", "responder")
    .addEdge("responder", END);

  return graph.compile();
}
