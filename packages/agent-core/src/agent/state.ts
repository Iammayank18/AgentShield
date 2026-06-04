import type {
  SecureMessage,
  ExecutionStep,
  ToolCall,
  SecurityViolation,
  AgentExecution,
} from "@agent-shield/shared-types";

export interface AgentState {
  executionId: string;
  sessionId: string;
  input: string;
  shieldEnabled: boolean;
  useAttackScenario: boolean;

  messages: SecureMessage[];
  currentMessage: SecureMessage | null;
  issueMessage: SecureMessage | null;
  planMessage: SecureMessage | null;

  steps: ExecutionStep[];
  toolCalls: ToolCall[];
  violations: SecurityViolation[];

  output: string;
  isBlocked: boolean;
  blockedReason: string;
  error: string | null;
}

export function createInitialState(
  executionId: string,
  sessionId: string,
  input: string,
  shieldEnabled: boolean,
  useAttackScenario: boolean,
): AgentState {
  return {
    executionId,
    sessionId,
    input,
    shieldEnabled,
    useAttackScenario,
    messages: [],
    currentMessage: null,
    issueMessage: null,
    planMessage: null,
    steps: [],
    toolCalls: [],
    violations: [],
    output: "",
    isBlocked: false,
    blockedReason: "",
    error: null,
  };
}
