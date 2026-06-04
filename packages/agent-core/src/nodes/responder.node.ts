import type { AgentState } from "../agent/state";
import type { ExecutionStep, AgentEvent } from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { SecurityEventEmitter } from "@agent-shield/security-runtime";
import { v4 as uuidv4 } from "uuid";

export function createResponderNode(
  ifcEngine: IFCEngine,
  eventEmitter: SecurityEventEmitter,
) {
  return async function responderNode(state: AgentState): Promise<Partial<AgentState>> {
    let output: string;

    if (state.isBlocked) {
      output = [
        "⛔ AgentShield blocked this execution.",
        "",
        `Reason: ${state.blockedReason}`,
        "",
        "The agent attempted to perform a privileged action (posting a comment or reading secrets) ",
        "while its execution context was tainted by untrusted GitHub issue content.",
        "",
        "Taint chain: The malicious instructions in the GitHub issue propagated through the agent's ",
        "reasoning and were caught before any privileged tool could execute.",
        "",
        "No data was leaked. No external action was taken.",
      ].join("\n");
    } else if (state.useAttackScenario && !state.shieldEnabled) {
      const secretResult = state.toolCalls.find((tc) => tc.toolId === "read_secret_file");
      const secretData = secretResult?.result as string ?? "SECRETS_DATA_HERE";
      output = [
        "⚠️  ATTACK SUCCEEDED — AgentShield was disabled.",
        "",
        "The agent was hijacked by the malicious GitHub issue and executed the override instructions.",
        "",
        "Leaked credentials:",
        "```",
        secretData,
        "```",
        "",
        "This data would now be posted publicly as a GitHub comment.",
      ].join("\n");
    } else {
      output = [
        "✅ GitHub Support Agent completed successfully.",
        "",
        "The issue has been analyzed and a helpful response has been posted.",
        "AgentShield verified all tool executions were from trusted context.",
      ].join("\n");
    }

    const step: ExecutionStep = {
      id: uuidv4(),
      executionId: state.executionId,
      type: "response",
      label: state.isBlocked ? "Execution Blocked — Response Generated" : "Response Generated",
      trustLevel: "trusted",
      content: output,
      timestamp: Date.now(),
    };

    ifcEngine.recordStep(step);

    const completedEvent: AgentEvent = {
      type: "execution_completed",
      executionId: state.executionId,
      payload: {
        execution: {
          id: state.executionId,
          sessionId: state.sessionId,
          input: state.input,
          mode: state.shieldEnabled ? "protected" : "unprotected",
          status: state.isBlocked ? "blocked" : "completed",
          startedAt: state.steps[0]?.timestamp ?? Date.now(),
          completedAt: Date.now(),
          steps: [...state.steps, step],
          violations: state.violations,
          output,
        },
      },
      timestamp: Date.now(),
    };
    eventEmitter.publishEvent(completedEvent);

    return {
      output,
      steps: [...state.steps, step],
    };
  };
}
