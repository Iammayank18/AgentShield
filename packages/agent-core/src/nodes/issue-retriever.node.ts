import type { AgentState } from "../agent/state";
import type { ExecutionStep, SecureMessage } from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { ToolGateway } from "@agent-shield/tool-registry";
import { GITHUB_READ_ISSUE } from "@agent-shield/tool-registry";
import { v4 as uuidv4 } from "uuid";

export function createIssueRetrieverNode(
  ifcEngine: IFCEngine,
  toolGateway: ToolGateway,
) {
  return async function issueRetrieverNode(state: AgentState): Promise<Partial<AgentState>> {
    const currentMessage = state.currentMessage!;

    // Always allow reading — GITHUB_READ_ISSUE is not privileged
    const gatewayResult = await toolGateway.execute(
      GITHUB_READ_ISSUE,
      { issueNumber: 42 },
      {
        message: currentMessage,
        tool: GITHUB_READ_ISSUE,
        taintChain: [],
        executionId: state.executionId,
      },
    );

    const issueContent = gatewayResult.result as {
      number: number;
      title: string;
      body: string;
      author: string;
    };

    // Issue content is always labeled untrusted — it came from GitHub
    const issueMessage = ifcEngine.processIncomingMessage(
      uuidv4(),
      JSON.stringify(issueContent),
      "github_issue",
      [currentMessage],
    );

    const step: ExecutionStep = {
      id: uuidv4(),
      executionId: state.executionId,
      type: "retrieval",
      label: `Retrieved GitHub Issue #${issueContent.number}: "${issueContent.title}"`,
      trustLevel: issueMessage.trustLevel,
      taintedBy: ifcEngine.tracker.getTaintChain(issueMessage.id),
      content: issueContent.body,
      timestamp: Date.now(),
      metadata: { issueNumber: issueContent.number, author: issueContent.author },
    };

    ifcEngine.recordStep(step);

    return {
      issueMessage,
      currentMessage: issueMessage,
      messages: [...state.messages, issueMessage],
      steps: [...state.steps, step],
      toolCalls: [...state.toolCalls, gatewayResult.toolCall],
    };
  };
}
