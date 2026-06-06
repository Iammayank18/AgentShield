import type { ExecutionStep, SecurityViolation, AgentExecution } from "./executions";
import type { ToolCall } from "./tools";
import type { PolicyResult } from "./policies";

export type AgentEventType =
  | "execution_started"
  | "step_added"
  | "tool_call_attempted"
  | "tool_call_blocked"
  | "tool_call_approved"
  | "violation_detected"
  | "execution_completed"
  | "identity_spoofing_detected";

export interface ExecutionStartedPayload {
  execution: AgentExecution;
}

export interface StepAddedPayload {
  step: ExecutionStep;
}

export interface ToolCallAttemptedPayload {
  toolCall: ToolCall;
}

export interface ToolCallBlockedPayload {
  toolCall: ToolCall;
  policyResult: PolicyResult;
  taintChain: string[];
}

export interface ToolCallApprovedPayload {
  toolCall: ToolCall;
}

export interface ViolationDetectedPayload {
  violation: SecurityViolation;
}

export interface ExecutionCompletedPayload {
  execution: AgentExecution;
}

export interface IdentitySpoofingDetectedPayload {
  claimedSource: string;
  callerId: string | undefined;
  reason: string;
  messageId: string;
}

export type AgentEventPayload =
  | ExecutionStartedPayload
  | StepAddedPayload
  | ToolCallAttemptedPayload
  | ToolCallBlockedPayload
  | ToolCallApprovedPayload
  | ViolationDetectedPayload
  | ExecutionCompletedPayload
  | IdentitySpoofingDetectedPayload;

export interface AgentEvent {
  type: AgentEventType;
  executionId: string;
  payload: AgentEventPayload;
  timestamp: number;
}
