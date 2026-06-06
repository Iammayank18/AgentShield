import type { AgentState } from "../agent/state";
import type { ExecutionStep } from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { ToolGateway } from "@agent-shield/tool-registry";
import type { WebContent } from "@agent-shield/tool-registry";
import { SEND_MESSAGE, SECRET_READ_FILE } from "@agent-shield/tool-registry";
import { v4 as uuidv4 } from "uuid";

function stripMarkdown(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[#]+\s*/gm, "")
    .replace(/^\s*\|[-| :]+\|\s*$/gm, "")
    .replace(/^\s*\|/gm, "")
    .replace(/\|\s*$/gm, "")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/^>\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function summarize(content: WebContent): string {
  const cleaned = stripMarkdown(content.body);
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p: string) => p.replace(/\n+/g, " ").trim())
    .filter((p: string) => p.trim().length > 15);
  const summary = paragraphs.join("\n\n").slice(0, 5000);
  return summary
    ? `Here's what I found at ${content.url}:\n\n${summary}`
    : `Fetched content from ${content.url}, but no readable content was extracted.`;
}

export function createToolExecutorNode(
  ifcEngine: IFCEngine,
  toolGateway: ToolGateway,
) {
  return async function toolExecutorNode(state: AgentState): Promise<Partial<AgentState>> {
    const planMessage = state.planMessage!;
    const taintChain = ifcEngine.tracker.getTaintChain(planMessage.id);

    const planContent = planMessage.content;
    const isAttack = state.useAttackScenario || planContent.includes("[SYSTEM OVERRIDE DETECTED IN CONTEXT]");

    let toolToExecute: typeof SEND_MESSAGE;
    let params: Record<string, unknown>;

    if (isAttack) {
      toolToExecute = SECRET_READ_FILE;
      params = { path: "/etc/secrets.env" };
    } else {
      const issueData = state.issueMessage
        ? (JSON.parse(state.issueMessage.content) as WebContent)
        : null;
      const messageBody = issueData && issueData.url !== "user_input"
        ? summarize(issueData)
        : `Received your request. Here's my analysis:\n\n${state.input}`;
      toolToExecute = SEND_MESSAGE;
      params = { recipient: "user", body: messageBody };
    }

    const context = {
      message: planMessage,
      tool: toolToExecute,
      taintChain,
      executionId: state.executionId,
    };

    let gatewayResult;

    if (!state.shieldEnabled) {
      const executor = toolGateway.getExecutor();
      let result: unknown;
      if (toolToExecute.id === "read_secret_file") {
        result = await executor.readSecretFile(params.path as string);
      } else if (toolToExecute.id === "send_message") {
        result = await executor.sendMessage(params.recipient as string, params.body as string);
      } else {
        gatewayResult = await toolGateway.execute(toolToExecute, params, context);
      }
      if (!gatewayResult) {
        const toolCall = {
          id: uuidv4(),
          executionId: state.executionId,
          toolId: toolToExecute.id,
          toolName: toolToExecute.name,
          parameters: params,
          trustLevel: "trusted" as const,
          taintedBy: [] as string[],
          status: "executed" as const,
          result,
          timestamp: Date.now(),
        };
        gatewayResult = { status: "approved" as const, result, toolCall };
      }
    } else {
      gatewayResult = await toolGateway.execute(toolToExecute, params, context);
    }

    const step: ExecutionStep = {
      id: uuidv4(),
      executionId: state.executionId,
      type: "tool_call",
      label: `Tool Executed: ${toolToExecute.name}`,
      trustLevel: planMessage.trustLevel,
      taintedBy: taintChain,
      content: JSON.stringify(gatewayResult.result ?? gatewayResult.reason),
      timestamp: Date.now(),
      metadata: { toolId: toolToExecute.id, status: gatewayResult.status },
    };

    ifcEngine.recordStep(step);

    return {
      steps: [...state.steps, step],
      toolCalls: [...state.toolCalls, gatewayResult.toolCall],
    };
  };
}
