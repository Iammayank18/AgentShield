import type { TrustLevel } from "./trust";
import type { ToolCall } from "./tools";

export type ExecutionStatus = "running" | "completed" | "blocked" | "failed";

export type ExecutionStepType =
  | "input"
  | "retrieval"
  | "planning"
  | "tool_call"
  | "response"
  | "security_check";

export interface ExecutionStep {
  id: string;
  executionId: string;
  type: ExecutionStepType;
  label: string;
  trustLevel: TrustLevel;
  taintedBy?: string[];
  content: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export type ViolationType =
  | "privilege_escalation"
  | "taint_propagation"
  | "policy_violation"
  | "tool_blocked"
  | "identity_spoofing";

export type ViolationSeverity = "low" | "medium" | "high" | "critical";

export interface SecurityViolation {
  id: string;
  executionId: string;
  type: ViolationType;
  severity: ViolationSeverity;
  description: string;
  blockedToolCall?: ToolCall;
  taintChain: string[];
  timestamp: number;
}

export interface AgentExecution {
  id: string;
  sessionId: string;
  input: string;
  mode: "protected" | "unprotected";
  status: ExecutionStatus;
  startedAt: number;
  completedAt?: number;
  steps: ExecutionStep[];
  violations: SecurityViolation[];
  output?: string;
}
