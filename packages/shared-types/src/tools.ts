import type { TrustLevel } from "./trust";

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface SecureTool {
  id: string;
  name: string;
  description: string;
  privileged: boolean;
  allowedTrustLevels: TrustLevel[];
  parameters: ToolParameter[];
}

export type ToolCallStatus =
  | "pending"
  | "approved"
  | "blocked"
  | "executed"
  | "failed";

export interface ToolCall {
  id: string;
  executionId: string;
  toolId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  trustLevel: TrustLevel;
  taintedBy?: string[];
  status: ToolCallStatus;
  blockedReason?: string;
  result?: unknown;
  timestamp: number;
}
