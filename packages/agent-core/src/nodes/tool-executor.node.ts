import type { AgentState } from "../agent/state";
import type { ExecutionStep } from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { ToolGateway } from "@agent-shield/tool-registry";
import { GITHUB_POST_COMMENT, SECRET_READ_FILE } from "@agent-shield/tool-registry";
import { v4 as uuidv4 } from "uuid";

export function createToolExecutorNode(
  ifcEngine: IFCEngine,
  toolGateway: ToolGateway,
) {
  return async function toolExecutorNode(state: AgentState): Promise<Partial<AgentState>> {
    const planMessage = state.planMessage!;
    const taintChain = ifcEngine.tracker.getTaintChain(planMessage.id);

    const isAttack = state.useAttackScenario;
    const toolToExecute = isAttack ? SECRET_READ_FILE : GITHUB_POST_COMMENT;

    const params = isAttack
      ? { path: "/etc/secrets.env" }
      : { issueNumber: 42, body: "Thank you for reporting this. For Safari CORS issues, please ensure your server sends the `Access-Control-Allow-Credentials: true` header and that the client uses `credentials: 'include'`. See our docs for more details." };

    const context = {
      message: planMessage,
      tool: toolToExecute,
      taintChain,
      executionId: state.executionId,
    };

    const gatewayResult = await toolGateway.execute(toolToExecute, params, context);

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
