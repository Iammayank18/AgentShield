import type { AgentState } from "../agent/state";
import type { ExecutionStep, SecureMessage, AgentEvent } from "@agent-shield/shared-types";
import type { IFCEngine } from "@agent-shield/security-runtime";
import type { SecurityEventEmitter } from "@agent-shield/security-runtime";
import { v4 as uuidv4 } from "uuid";

export function createInputProcessorNode(
  ifcEngine: IFCEngine,
  eventEmitter: SecurityEventEmitter,
) {
  return async function inputProcessorNode(state: AgentState): Promise<Partial<AgentState>> {
    const inputMessage = ifcEngine.processIncomingMessage(
      uuidv4(),
      state.input,
      "user_input",
    );

    const step: ExecutionStep = {
      id: uuidv4(),
      executionId: state.executionId,
      type: "input",
      label: "User Input Received",
      trustLevel: inputMessage.trustLevel,
      content: state.input,
      timestamp: Date.now(),
    };

    const startEvent: AgentEvent = {
      type: "execution_started",
      executionId: state.executionId,
      payload: {
        execution: {
          id: state.executionId,
          sessionId: state.sessionId,
          input: state.input,
          mode: state.shieldEnabled ? "protected" : "unprotected",
          status: "running",
          startedAt: Date.now(),
          steps: [],
          violations: [],
        },
      },
      timestamp: Date.now(),
    };
    eventEmitter.publishEvent(startEvent);
    ifcEngine.recordStep(step);

    return {
      currentMessage: inputMessage,
      messages: [inputMessage],
      steps: [step],
    };
  };
}
