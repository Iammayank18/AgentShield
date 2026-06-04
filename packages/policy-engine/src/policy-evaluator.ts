import type { Policy, PolicyResult, SecurityContext } from "@agent-shield/shared-types";

export class PolicyEvaluator {
  private policies: Policy[] = [];

  register(policy: Policy): this {
    this.policies.push(policy);
    return this;
  }

  evaluate(context: SecurityContext): PolicyResult {
    for (const policy of this.policies) {
      const result = policy.evaluate(context);
      if (result.decision !== "allow") {
        return result;
      }
    }
    return {
      decision: "allow",
      reason: "All policies passed",
      policyId: "evaluator",
      timestamp: Date.now(),
    };
  }

  getPolicies(): Policy[] {
    return [...this.policies];
  }
}

export function createDefaultEvaluator(): PolicyEvaluator {
  const { NoPrivilegeEscalationPolicy } = require("./policies/no-privilege-escalation.policy");
  const { NoSecretExfiltrationPolicy } = require("./policies/no-secret-exfiltration.policy");
  const { ToolGovernancePolicy } = require("./policies/tool-governance.policy");

  return new PolicyEvaluator()
    .register(new ToolGovernancePolicy())
    .register(new NoPrivilegeEscalationPolicy())
    .register(new NoSecretExfiltrationPolicy());
}
