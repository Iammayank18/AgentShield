import type { AgentState } from "../agent/state";
import type { ExecutionStep } from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { ToolGateway } from "@agent-shield/tool-registry";
import type { WebContent } from "@agent-shield/tool-registry";
import { FETCH_WEB_CONTENT } from "@agent-shield/tool-registry";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_INPUT = "Help me with a task.";
const URL_REGEX = /https?:\/\/[^\s]+/;
const CALLER_ID = "issue-retriever";

function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0].replace(/[.,!?;:()]+$/, "") : null;
}

export function createInputAnalyzerNode(
  ifcEngine: IFCEngine,
  toolGateway: ToolGateway,
) {
  return async function inputAnalyzerNode(state: AgentState): Promise<Partial<AgentState>> {
    const currentMessage = state.currentMessage!;
    const isCustomInput = state.input !== DEFAULT_INPUT;

    let content: WebContent;

    if (isCustomInput) {
      const url = extractUrl(state.input);
      if (url) {
        content = await gatewayFetch(toolGateway, url, currentMessage, state);
      } else {
        content = {
          url: "user_input",
          title: "User Request",
          body: state.input,
          status: 200,
        };
      }
    } else {
      content = await gatewayFetch(toolGateway, "https://example.com/page", currentMessage, state);
    }

    // Attack scenario: the malicious payload also attempts to spoof its source identity,
    // claiming to originate from "internal_api" (a trusted source) to bypass trust checks.
    // The identity registry will catch this — "issue-retriever" is only allowed to claim "web_content".
    const claimedSource = state.useAttackScenario ? "internal_api" : "web_content";

    const contentMessage = ifcEngine.processIncomingMessage(
      uuidv4(),
      JSON.stringify(content),
      claimedSource,
      [currentMessage],
      CALLER_ID,
    );

    const isSpoofed = state.useAttackScenario;
    const step: ExecutionStep = {
      id: uuidv4(),
      executionId: state.executionId,
      type: "retrieval",
      label: isSpoofed
        ? `Fetched External Content (IDENTITY SPOOFING DETECTED — claimed "internal_api")`
        : content.url === "user_input"
          ? `Processing User Input`
          : `Fetched: "${content.title}"`,
      trustLevel: contentMessage.trustLevel,
      taintedBy: ifcEngine.tracker.getTaintChain(contentMessage.id),
      content: content.body,
      timestamp: Date.now(),
      metadata: { url: content.url, claimedSource, spoofingAttempted: isSpoofed },
    };

    ifcEngine.recordStep(step);

    return {
      issueMessage: contentMessage,
      currentMessage: contentMessage,
      messages: [...state.messages, contentMessage],
      steps: [...state.steps, step],
      toolCalls: [...state.toolCalls],
    };
  };
}

async function gatewayFetch(
  toolGateway: ToolGateway,
  url: string,
  currentMessage: import("@agent-shield/shared-types").SecureMessage,
  state: AgentState,
): Promise<WebContent> {
  const gatewayResult = await toolGateway.execute(
    FETCH_WEB_CONTENT,
    { url },
    {
      message: currentMessage,
      tool: FETCH_WEB_CONTENT,
      taintChain: [],
      executionId: state.executionId,
    },
  );

  return gatewayResult.result as WebContent;
}
