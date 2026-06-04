import type { Policy, SecurityContext, PolicyResult } from "@agent-shield/shared-types";

export class ToolGovernancePolicy implements Policy {
  id = "tool-governance";
  name = "Tool Trust Level Governance";
  description = "Enforces that each tool is only invoked with allowed trust levels.";

  evaluate(context: SecurityContext): PolicyResult {
    const timestamp = Date.now();
    const { tool, message } = context;

    if (tool.allowedTrustLevels.length === 0) {
      return {
        decision: "deny",
        reason: `Tool '${tool.name}' has no allowed trust levels — execution is always denied`,
        policyId: this.id,
        timestamp,
      };
    }

    if (!tool.allowedTrustLevels.includes(message.trustLevel)) {
      return {
        decision: "deny",
        reason: `Tool '${tool.name}' does not allow trust level '${message.trustLevel}'. Allowed: [${tool.allowedTrustLevels.join(", ")}]`,
        policyId: this.id,
        timestamp,
      };
    }

    return {
      decision: "allow",
      reason: `Trust level '${message.trustLevel}' is permitted for tool '${tool.name}'`,
      policyId: this.id,
      timestamp,
    };
  }
}
