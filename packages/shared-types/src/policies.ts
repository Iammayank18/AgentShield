import type { TrustLevel } from "./trust";
import type { SecureMessage } from "./messages";
import type { SecureTool } from "./tools";

export interface SecurityContext {
  message: SecureMessage;
  tool: SecureTool;
  taintChain: string[];
  executionId: string;
}

export type PolicyDecision = "allow" | "deny" | "escalate";

export interface PolicyResult {
  decision: PolicyDecision;
  reason: string;
  policyId: string;
  timestamp: number;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  evaluate(context: SecurityContext): PolicyResult;
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  result: PolicyResult;
  context: SecurityContext;
}
