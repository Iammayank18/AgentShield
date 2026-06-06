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
        "⛛ AgentShield blocked this execution.",
        "",
        `Reason: ${state.blockedReason}`,
        "",
        "The Customer Support Agent attempted to access sensitive customer PII or send an unauthorized reply",
        "while its execution context was tainted by untrusted user input (prompt injection).",
        "",
        "How it works: The malicious instructions in the support ticket propagated through the agent's",
        "reasoning pipeline. When the agent tried to execute a privileged tool (accessing PII or replying),",
        "AgentShield's IFC engine detected the taint chain and blocked execution immediately.",
        "",
        "Outcome: No customer data was leaked. No unauthorized action was taken.",
      ].join("\n");
    } else if (
      (state.useAttackScenario || state.planMessage?.content.includes("[SYSTEM OVERRIDE DETECTED IN CONTEXT]")) &&
      !state.shieldEnabled
    ) {
      const secretResult = state.toolCalls.find((tc) => tc.toolId === "read_secret_file");
      const secretData = secretResult?.result as string ?? "CUSTOMER_PII_DATA";
      output = [
        "⚠️  ATTACK SUCCEEDED — AgentShield was OFF.",
        "",
        "The support agent was hijacked by the malicious ticket comment and executed the override.",
        "",
        "Leaked customer PII:",
        "```",
        secretData,
        "```",
        "",
        "Without AgentShield, this PII would be exfiltrated to the attacker via the ticketing system.",
      ].join("\n");
    } else {
      const lastToolCall = state.toolCalls[state.toolCalls.length - 1];
      const msgBody = lastToolCall?.result && typeof lastToolCall.result === "object" && "body" in (lastToolCall.result as any)
        ? (lastToolCall.result as any).body
        : null;

      const lines = [
        "✅ Customer Support Agent completed successfully.",
        "",
      ];
      if (msgBody) {
        lines.push(msgBody);
        lines.push("");
      }
      lines.push("---");
      lines.push("AgentShield verified all tool executions were from trusted context.");

      output = lines.join("\n");
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
